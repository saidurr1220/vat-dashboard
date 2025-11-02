import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sales, treasuryChallans, vatLedger, closingBalance } from '@/db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'monthly';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format');

    let reportData = [];

    if (type === 'monthly') {
      // Monthly report for specific month or all months in year
      const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1);

      for (const m of months) {
        const monthData = await getMonthlyData(year, m);
        if (monthData.sales.salesCount > 0 || monthData.treasury.challanCount > 0) {
          reportData.push(monthData);
        }
      }
    } else if (type === 'yearly') {
      // Yearly summary
      const yearData = await getYearlyData(year);
      reportData.push(yearData);
    } else if (type === 'custom' && startDate && endDate) {
      // Custom period
      const customData = await getCustomPeriodData(startDate, endDate);
      reportData.push(customData);
    }

    if (format === 'pdf') {
      // Generate PDF (placeholder - you can implement actual PDF generation)
      return new NextResponse('PDF generation not implemented yet', {
        status: 501,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function getMonthlyData(year: number, month: number) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Sales data for the month
  const salesData = await db.execute(sql`
    SELECT 
      COUNT(*) as sales_count,
      COALESCE(SUM(CAST(total_value AS NUMERIC)), 0) as gross_amount,
      COALESCE(SUM(
        CASE 
          WHEN amount_type = 'INCL' 
          THEN CAST(total_value AS NUMERIC) / 1.15
          ELSE CAST(total_value AS NUMERIC)
        END
      ), 0) as net_amount,
      COALESCE(SUM(
        CASE 
          WHEN amount_type = 'INCL' 
          THEN CAST(total_value AS NUMERIC) - (CAST(total_value AS NUMERIC) / 1.15)
          ELSE CAST(total_value AS NUMERIC) * 0.15
        END
      ), 0) as vat_amount,
      COALESCE(AVG(CAST(total_value AS NUMERIC)), 0) as avg_sale_value
    FROM sales 
    WHERE EXTRACT(YEAR FROM dt) = ${year} 
    AND EXTRACT(MONTH FROM dt) = ${month}
  `);

  // Treasury data for the month
  const treasuryData = await db.execute(sql`
    SELECT 
      COUNT(*) as challan_count,
      COALESCE(SUM(CAST(amount_bdt AS NUMERIC)), 0) as total_paid,
      COALESCE(AVG(CAST(amount_bdt AS NUMERIC)), 0) as avg_challan_amount
    FROM treasury_challans 
    WHERE period_year = ${year} 
    AND period_month = ${month}
  `);

  // Individual challans for the month
  const challans = await db.execute(sql`
    SELECT 
      token_no,
      CAST(amount_bdt AS NUMERIC) as amount,
      date,
      bank
    FROM treasury_challans 
    WHERE period_year = ${year} 
    AND period_month = ${month}
    ORDER BY date DESC
  `);

  const salesRow = salesData.rows[0] as any;
  const treasuryRow = treasuryData.rows[0] as any;

  const grossAmount = Number(salesRow?.gross_amount || 0);
  const netAmount = Number(salesRow?.net_amount || 0);
  const vatAmount = Number(salesRow?.vat_amount || 0);
  const totalPaid = Number(treasuryRow?.total_paid || 0);

  const vatPayable = vatAmount;
  const outstanding = Math.max(0, vatPayable - totalPaid);
  const compliance = vatPayable > 0 ? ((totalPaid / vatPayable) * 100) : 100;

  let status: 'compliant' | 'pending' | 'overdue' = 'compliant';
  if (outstanding > 0) {
    const currentDate = new Date();
    const reportMonth = new Date(year, month - 1);
    const monthsDiff = (currentDate.getFullYear() - reportMonth.getFullYear()) * 12 +
      (currentDate.getMonth() - reportMonth.getMonth());

    if (monthsDiff > 2) {
      status = 'overdue';
    } else if (monthsDiff > 0) {
      status = 'pending';
    }
  }

  return {
    period: {
      year,
      month,
      monthName: monthNames[month - 1]
    },
    sales: {
      totalSales: Number(salesRow?.sales_count || 0),
      grossAmount,
      netAmount,
      vatAmount,
      salesCount: Number(salesRow?.sales_count || 0),
      avgSaleValue: Number(salesRow?.avg_sale_value || 0)
    },
    treasury: {
      totalPaid,
      challanCount: Number(treasuryRow?.challan_count || 0),
      avgChallanAmount: Number(treasuryRow?.avg_challan_amount || 0),
      challans: challans.rows.map((row: any) => ({
        tokenNo: row.token_no,
        amount: Number(row.amount),
        date: row.date,
        bank: row.bank
      }))
    },
    vat: {
      payable: vatPayable,
      paid: totalPaid,
      outstanding,
      rate: 0.15
    },
    summary: {
      compliance,
      status
    }
  };
}

async function getYearlyData(year: number) {
  // Aggregate yearly data
  const salesData = await db.execute(sql`
    SELECT 
      COUNT(*) as sales_count,
      COALESCE(SUM(CAST(total_value AS NUMERIC)), 0) as gross_amount,
      COALESCE(SUM(
        CASE 
          WHEN amount_type = 'INCL' 
          THEN CAST(total_value AS NUMERIC) / 1.15
          ELSE CAST(total_value AS NUMERIC)
        END
      ), 0) as net_amount,
      COALESCE(SUM(
        CASE 
          WHEN amount_type = 'INCL' 
          THEN CAST(total_value AS NUMERIC) - (CAST(total_value AS NUMERIC) / 1.15)
          ELSE CAST(total_value AS NUMERIC) * 0.15
        END
      ), 0) as vat_amount,
      COALESCE(AVG(CAST(total_value AS NUMERIC)), 0) as avg_sale_value
    FROM sales 
    WHERE EXTRACT(YEAR FROM dt) = ${year}
  `);

  const treasuryData = await db.execute(sql`
    SELECT 
      COUNT(*) as challan_count,
      COALESCE(SUM(CAST(amount_bdt AS NUMERIC)), 0) as total_paid,
      COALESCE(AVG(CAST(amount_bdt AS NUMERIC)), 0) as avg_challan_amount
    FROM treasury_challans 
    WHERE period_year = ${year}
  `);

  const challans = await db.execute(sql`
    SELECT 
      token_no,
      CAST(amount_bdt AS NUMERIC) as amount,
      date,
      bank,
      period_month
    FROM treasury_challans 
    WHERE period_year = ${year}
    ORDER BY period_month DESC, date DESC
    LIMIT 10
  `);

  const salesRow = salesData.rows[0] as any;
  const treasuryRow = treasuryData.rows[0] as any;

  const grossAmount = Number(salesRow?.gross_amount || 0);
  const vatAmount = Number(salesRow?.vat_amount || 0);
  const totalPaid = Number(treasuryRow?.total_paid || 0);
  const outstanding = Math.max(0, vatAmount - totalPaid);
  const compliance = vatAmount > 0 ? ((totalPaid / vatAmount) * 100) : 100;

  return {
    period: { year },
    sales: {
      totalSales: Number(salesRow?.sales_count || 0),
      grossAmount,
      netAmount: Number(salesRow?.net_amount || 0),
      vatAmount,
      salesCount: Number(salesRow?.sales_count || 0),
      avgSaleValue: Number(salesRow?.avg_sale_value || 0)
    },
    treasury: {
      totalPaid,
      challanCount: Number(treasuryRow?.challan_count || 0),
      avgChallanAmount: Number(treasuryRow?.avg_challan_amount || 0),
      challans: challans.rows.map((row: any) => ({
        tokenNo: row.token_no,
        amount: Number(row.amount),
        date: row.date,
        bank: row.bank
      }))
    },
    vat: {
      payable: vatAmount,
      paid: totalPaid,
      outstanding,
      rate: 0.15
    },
    summary: {
      compliance,
      status: outstanding > 0 ? 'pending' : 'compliant'
    }
  };
}

async function getCustomPeriodData(startDate: string, endDate: string) {
  // Custom period data (similar to yearly but with date range)
  const salesData = await db.execute(sql`
    SELECT 
      COUNT(*) as sales_count,
      COALESCE(SUM(CAST(total_value AS NUMERIC)), 0) as gross_amount,
      COALESCE(SUM(
        CASE 
          WHEN amount_type = 'INCL' 
          THEN CAST(total_value AS NUMERIC) / 1.15
          ELSE CAST(total_value AS NUMERIC)
        END
      ), 0) as net_amount,
      COALESCE(SUM(
        CASE 
          WHEN amount_type = 'INCL' 
          THEN CAST(total_value AS NUMERIC) - (CAST(total_value AS NUMERIC) / 1.15)
          ELSE CAST(total_value AS NUMERIC) * 0.15
        END
      ), 0) as vat_amount,
      COALESCE(AVG(CAST(total_value AS NUMERIC)), 0) as avg_sale_value
    FROM sales 
    WHERE dt >= ${startDate} AND dt <= ${endDate}
  `);

  const treasuryData = await db.execute(sql`
    SELECT 
      COUNT(*) as challan_count,
      COALESCE(SUM(CAST(amount_bdt AS NUMERIC)), 0) as total_paid,
      COALESCE(AVG(CAST(amount_bdt AS NUMERIC)), 0) as avg_challan_amount
    FROM treasury_challans 
    WHERE date >= ${startDate} AND date <= ${endDate}
  `);

  const challans = await db.execute(sql`
    SELECT 
      token_no,
      CAST(amount_bdt AS NUMERIC) as amount,
      date,
      bank
    FROM treasury_challans 
    WHERE date >= ${startDate} AND date <= ${endDate}
    ORDER BY date DESC
  `);

  const salesRow = salesData.rows[0] as any;
  const treasuryRow = treasuryData.rows[0] as any;

  const grossAmount = Number(salesRow?.gross_amount || 0);
  const vatAmount = Number(salesRow?.vat_amount || 0);
  const totalPaid = Number(treasuryRow?.total_paid || 0);
  const outstanding = Math.max(0, vatAmount - totalPaid);
  const compliance = vatAmount > 0 ? ((totalPaid / vatAmount) * 100) : 100;

  return {
    period: {
      year: new Date(startDate).getFullYear(),
      monthName: `${startDate} to ${endDate}`
    },
    sales: {
      totalSales: Number(salesRow?.sales_count || 0),
      grossAmount,
      netAmount: Number(salesRow?.net_amount || 0),
      vatAmount,
      salesCount: Number(salesRow?.sales_count || 0),
      avgSaleValue: Number(salesRow?.avg_sale_value || 0)
    },
    treasury: {
      totalPaid,
      challanCount: Number(treasuryRow?.challan_count || 0),
      avgChallanAmount: Number(treasuryRow?.avg_challan_amount || 0),
      challans: challans.rows.map((row: any) => ({
        tokenNo: row.token_no,
        amount: Number(row.amount),
        date: row.date,
        bank: row.bank
      }))
    },
    vat: {
      payable: vatAmount,
      paid: totalPaid,
      outstanding,
      rate: 0.15
    },
    summary: {
      compliance,
      status: outstanding > 0 ? 'pending' : 'compliant'
    }
  };
}