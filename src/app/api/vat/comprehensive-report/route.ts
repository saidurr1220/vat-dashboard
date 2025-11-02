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
      // Generate PDF using HTML to PDF conversion
      const html = generateReportHTML(reportData, { type, year, month });

      try {
        // For now, return a simple text-based report that can be saved as PDF
        const textReport = generateTextReport(reportData, { type, year, month });

        return new NextResponse(textReport, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="VAT-Report-${year}${month ? `-${String(month).padStart(2, '0')}` : ''}.txt"`
          }
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        return new NextResponse('PDF generation failed', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
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

  // Get closing balance data (import stage AT & VAT payments)
  const closingBalanceData = await db.execute(sql`
    SELECT 
      COALESCE(closing_balance, 0) as closing_balance,
      COALESCE(used_amount, 0) as used_amount,
      COALESCE(current_month_addition, 0) as current_month_addition
    FROM closing_balance 
    WHERE period_year = ${year} 
    AND period_month = ${month}
  `);

  // Get import stage AT & VAT data for context (may be incomplete)
  const importData = await db.execute(sql`
    SELECT 
      COALESCE(SUM(CAST(vat AS NUMERIC)), 0) as total_import_vat,
      COALESCE(SUM(CAST(at AS NUMERIC)), 0) as total_import_at,
      COUNT(*) as import_count
    FROM imports_boe 
    WHERE EXTRACT(YEAR FROM boe_date) = ${year} 
    AND EXTRACT(MONTH FROM boe_date) = ${month}
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
  const closingBalanceRow = closingBalanceData.rows[0] as any;
  const importRow = importData.rows[0] as any;

  const grossAmount = Number(salesRow?.gross_amount || 0);
  const netAmount = Number(salesRow?.net_amount || 0);
  const vatAmount = Number(salesRow?.vat_amount || 0);
  const totalPaid = Number(treasuryRow?.total_paid || 0);
  const closingBalance = Number(closingBalanceRow?.closing_balance || 0);
  const usedFromClosingBalance = Number(closingBalanceRow?.used_amount || 0);

  const vatPayable = vatAmount;
  // Outstanding = VAT Payable - Treasury Paid - Closing Balance Used
  const outstanding = Math.max(0, vatPayable - totalPaid - closingBalance);
  const compliance = vatPayable > 0 ? (((totalPaid + closingBalance) / vatPayable) * 100) : 100;

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
    closingBalance: {
      available: closingBalance,
      used: usedFromClosingBalance,
      currentMonthAddition: Number(closingBalanceRow?.current_month_addition || 0)
    },
    imports: {
      totalVat: Number(importRow?.total_import_vat || 0),
      totalAt: Number(importRow?.total_import_at || 0),
      importCount: Number(importRow?.import_count || 0)
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

  // Get total closing balance for the year
  const closingBalanceData = await db.execute(sql`
    SELECT 
      COALESCE(SUM(closing_balance), 0) as total_closing_balance,
      COALESCE(SUM(used_amount), 0) as total_used_amount,
      COALESCE(SUM(current_month_addition), 0) as total_additions
    FROM closing_balance 
    WHERE period_year = ${year}
  `);

  // Get yearly import data
  const importData = await db.execute(sql`
    SELECT 
      COALESCE(SUM(CAST(vat AS NUMERIC)), 0) as total_import_vat,
      COALESCE(SUM(CAST(at AS NUMERIC)), 0) as total_import_at,
      COUNT(*) as import_count
    FROM imports_boe 
    WHERE EXTRACT(YEAR FROM boe_date) = ${year}
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
  const closingBalanceRow = closingBalanceData.rows[0] as any;
  const importRow = importData.rows[0] as any;

  const grossAmount = Number(salesRow?.gross_amount || 0);
  const vatAmount = Number(salesRow?.vat_amount || 0);
  const totalPaid = Number(treasuryRow?.total_paid || 0);
  const totalClosingBalance = Number(closingBalanceRow?.total_closing_balance || 0);

  const outstanding = Math.max(0, vatAmount - totalPaid - totalClosingBalance);
  const compliance = vatAmount > 0 ? (((totalPaid + totalClosingBalance) / vatAmount) * 100) : 100;

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
    closingBalance: {
      available: totalClosingBalance,
      used: Number(closingBalanceRow?.total_used_amount || 0),
      currentMonthAddition: Number(closingBalanceRow?.total_additions || 0)
    },
    imports: {
      totalVat: Number(importRow?.total_import_vat || 0),
      totalAt: Number(importRow?.total_import_at || 0),
      importCount: Number(importRow?.import_count || 0)
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

  // Get closing balance data for the period
  const closingBalanceData = await db.execute(sql`
    SELECT 
      COALESCE(SUM(closing_balance), 0) as total_closing_balance,
      COALESCE(SUM(used_amount), 0) as total_used_amount,
      COALESCE(SUM(current_month_addition), 0) as total_additions
    FROM closing_balance 
    WHERE (period_year || '-' || LPAD(period_month::text, 2, '0') || '-01')::date >= ${startDate}
    AND (period_year || '-' || LPAD(period_month::text, 2, '0') || '-01')::date <= ${endDate}
  `);

  // Get import data for the period
  const importData = await db.execute(sql`
    SELECT 
      COALESCE(SUM(CAST(vat AS NUMERIC)), 0) as total_import_vat,
      COALESCE(SUM(CAST(at AS NUMERIC)), 0) as total_import_at,
      COUNT(*) as import_count
    FROM imports_boe 
    WHERE boe_date >= ${startDate} AND boe_date <= ${endDate}
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
  const closingBalanceRow = closingBalanceData.rows[0] as any;
  const importRow = importData.rows[0] as any;

  const grossAmount = Number(salesRow?.gross_amount || 0);
  const vatAmount = Number(salesRow?.vat_amount || 0);
  const totalPaid = Number(treasuryRow?.total_paid || 0);
  const totalClosingBalance = Number(closingBalanceRow?.total_closing_balance || 0);

  const outstanding = Math.max(0, vatAmount - totalPaid - totalClosingBalance);
  const compliance = vatAmount > 0 ? (((totalPaid + totalClosingBalance) / vatAmount) * 100) : 100;

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
    closingBalance: {
      available: totalClosingBalance,
      used: Number(closingBalanceRow?.total_used_amount || 0),
      currentMonthAddition: Number(closingBalanceRow?.total_additions || 0)
    },
    imports: {
      totalVat: Number(importRow?.total_import_vat || 0),
      totalAt: Number(importRow?.total_import_at || 0),
      importCount: Number(importRow?.import_count || 0)
    },
    summary: {
      compliance,
      status: outstanding > 0 ? 'pending' : 'compliant'
    }
  };
}

function generateTextReport(reportData: any[], options: { type: string; year: number; month?: number | null }) {
  const { type, year, month } = options;
  let report = '';

  // Header
  report += '='.repeat(80) + '\n';
  report += '                    COMPREHENSIVE VAT REPORT\n';
  report += '                      M S RAHMAN TRADERS\n';
  report += '='.repeat(80) + '\n';
  report += `Report Type: ${type.toUpperCase()}\n`;
  report += `Period: ${month ? `${getMonthName(month)} ${year}` : `Year ${year}`}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += '='.repeat(80) + '\n\n';

  reportData.forEach((data, index) => {
    if (reportData.length > 1) {
      report += `\n${'='.repeat(60)}\n`;
      report += `PERIOD: ${data.period.monthName || `Year ${data.period.year}`}\n`;
      report += `${'='.repeat(60)}\n`;
    }

    // Summary Section
    report += '\nSUMMARY\n';
    report += '-'.repeat(40) + '\n';
    report += `Total Sales:           ৳${data.sales.grossAmount.toLocaleString()}\n`;
    report += `VAT Payable:           ৳${data.vat.payable.toLocaleString()}\n`;
    report += `Treasury Paid:         ৳${data.treasury.totalPaid.toLocaleString()}\n`;
    report += `Outstanding VAT:       ৳${data.vat.outstanding.toLocaleString()}\n`;
    report += `Compliance Rate:       ${data.summary.compliance.toFixed(1)}%\n`;
    report += `Status:                ${data.summary.status.toUpperCase()}\n`;

    // Sales Breakdown
    report += '\nSALES BREAKDOWN\n';
    report += '-'.repeat(40) + '\n';
    report += `Gross Sales:           ৳${data.sales.grossAmount.toLocaleString()}\n`;
    report += `Net Sales (Ex-VAT):    ৳${data.sales.netAmount.toLocaleString()}\n`;
    report += `VAT Amount:            ৳${data.sales.vatAmount.toLocaleString()}\n`;
    report += `Total Transactions:    ${data.sales.salesCount}\n`;
    report += `Average Sale Value:    ৳${data.sales.avgSaleValue.toLocaleString()}\n`;

    // VAT Details
    report += '\nVAT DETAILS\n';
    report += '-'.repeat(40) + '\n';
    report += `VAT Payable:           ৳${data.vat.payable.toLocaleString()}\n`;
    report += `VAT Rate:              ${(data.vat.rate * 100).toFixed(1)}%\n`;
    report += `Treasury Payments:     ৳${data.vat.paid.toLocaleString()}\n`;
    report += `Outstanding Balance:   ৳${data.vat.outstanding.toLocaleString()}\n`;

    // Closing Balance
    report += '\nCLOSING BALANCE (IMPORT AT & VAT)\n';
    report += '-'.repeat(40) + '\n';
    report += `Available Balance:     ৳${data.closingBalance.available.toLocaleString()}\n`;
    report += `Used This Period:      ৳${data.closingBalance.used.toLocaleString()}\n`;
    report += `Current Addition:      ৳${data.closingBalance.currentMonthAddition.toLocaleString()}\n`;
    report += `Net Available:         ৳${(data.closingBalance.available - data.closingBalance.used).toLocaleString()}\n`;

    // Import Information
    report += '\nIMPORT STAGE PAYMENTS\n';
    report += '-'.repeat(40) + '\n';
    report += `Import VAT Paid:       ৳${data.imports.totalVat.toLocaleString()}\n`;
    report += `Advance Tax (AT):      ৳${data.imports.totalAt.toLocaleString()}\n`;
    report += `Import Entries:        ${data.imports.importCount} BOE\n`;
    report += `Total Import Payments: ৳${(data.imports.totalVat + data.imports.totalAt).toLocaleString()}\n`;

    // Treasury Challans
    if (data.treasury.challans.length > 0) {
      report += '\nTREASURY CHALLANS\n';
      report += '-'.repeat(40) + '\n';
      data.treasury.challans.forEach((challan: any) => {
        report += `${challan.tokenNo.padEnd(15)} ৳${challan.amount.toLocaleString().padStart(12)} ${challan.bank}\n`;
      });
      report += '-'.repeat(40) + '\n';
      report += `Total Challans: ${data.treasury.challanCount}\n`;
      report += `Total Amount:   ৳${data.treasury.totalPaid.toLocaleString()}\n`;
    }

    // Compliance Analysis
    report += '\nCOMPLIANCE ANALYSIS\n';
    report += '-'.repeat(40) + '\n';
    report += `VAT Payable:           ৳${data.vat.payable.toLocaleString()}\n`;
    report += `Treasury Paid:         ৳${data.vat.paid.toLocaleString()}\n`;
    report += `Closing Balance Used:  ৳${data.closingBalance.available.toLocaleString()}\n`;
    report += `Total Coverage:        ৳${(data.vat.paid + data.closingBalance.available).toLocaleString()}\n`;
    report += `Outstanding:           ৳${data.vat.outstanding.toLocaleString()}\n`;
    report += `Compliance Rate:       ${data.summary.compliance.toFixed(1)}%\n`;

    if (index < reportData.length - 1) {
      report += '\n' + '='.repeat(80) + '\n';
    }
  });

  // Footer
  report += '\n\n' + '='.repeat(80) + '\n';
  report += 'Report generated by VAT Management System\n';
  report += `Generated on: ${new Date().toLocaleString()}\n`;
  report += '='.repeat(80) + '\n';

  return report;
}

function generateReportHTML(reportData: any[], options: { type: string; year: number; month?: number | null }) {
  // This could be expanded to generate proper HTML for PDF conversion
  return `
    <html>
      <head>
        <title>VAT Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Comprehensive VAT Report</h1>
          <h2>M S RAHMAN TRADERS</h2>
          <p>Period: ${options.month ? getMonthName(options.month) + ' ' + options.year : 'Year ' + options.year}</p>
        </div>
        <!-- Report content would go here -->
      </body>
    </html>
  `;
}

function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || 'Unknown';
}