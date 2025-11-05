import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 1. Overall Business Metrics
    const overallMetrics = await db.execute(sql`
      SELECT 
        COALESCE(SUM(sl.qty), 0) as total_units_sold,
        COALESCE(SUM(s.total_value), 0) as total_revenue,
        COUNT(DISTINCT s.id) as total_transactions,
        COUNT(DISTINCT s.customer) as unique_customers,
        COUNT(DISTINCT sl.product_id) as products_sold
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
    `);

    // 2. Current Month Performance
    const currentMonth = await db.execute(sql`
      SELECT 
        COALESCE(SUM(sl.qty), 0) as units,
        COALESCE(SUM(s.total_value), 0) as revenue,
        COUNT(DISTINCT s.id) as transactions,
        COUNT(DISTINCT s.customer) as customers,
        COUNT(DISTINCT sl.product_id) as products
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE DATE_TRUNC('month', s.dt) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // 3. Previous Month for Comparison
    const previousMonth = await db.execute(sql`
      SELECT 
        COALESCE(SUM(sl.qty), 0) as units,
        COALESCE(SUM(s.total_value), 0) as revenue,
        COUNT(DISTINCT s.id) as transactions
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE DATE_TRUNC('month', s.dt) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `);

    // 4. Top 5 Products by Revenue (Current Month)
    const topProducts = await db.execute(sql`
      SELECT 
        p.name,
        p.category,
        COALESCE(SUM(sl.qty), 0) as qty_sold,
        COALESCE(SUM(sl.line_total_calc), 0) as revenue
      FROM sales_lines sl
      JOIN sales s ON sl.sale_id = s.id
      JOIN products p ON sl.product_id = p.id
      WHERE DATE_TRUNC('month', s.dt) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY p.id, p.name, p.category
      ORDER BY revenue DESC
      LIMIT 5
    `);

    // 5. Top 5 Customers by Revenue (Current Month)
    const topCustomers = await db.execute(sql`
      SELECT 
        s.customer,
        COUNT(DISTINCT s.id) as transactions,
        COALESCE(SUM(s.total_value), 0) as revenue
      FROM sales s
      WHERE DATE_TRUNC('month', s.dt) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY s.customer
      ORDER BY revenue DESC
      LIMIT 5
    `);

    // 6. Category Performance (Current Month)
    const categoryPerformance = await db.execute(sql`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as products,
        COALESCE(SUM(sl.qty), 0) as units_sold,
        COALESCE(SUM(sl.line_total_calc), 0) as revenue
      FROM sales_lines sl
      JOIN sales s ON sl.sale_id = s.id
      JOIN products p ON sl.product_id = p.id
      WHERE DATE_TRUNC('month', s.dt) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY p.category
      ORDER BY revenue DESC
    `);

    // 7. Monthly Trend (Last 6 Months)
    const monthlyTrend = await db.execute(sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', s.dt), 'Mon YYYY') as month,
        COALESCE(SUM(sl.qty), 0) as units,
        COALESCE(SUM(s.total_value), 0) as revenue,
        COUNT(DISTINCT s.id) as transactions
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE s.dt >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', s.dt)
      ORDER BY DATE_TRUNC('month', s.dt) DESC
    `);

    // 8. VAT Summary (Current Month)
    const vatSummary = await db.execute(sql`
      SELECT 
        COALESCE(SUM(s.total_value), 0) as total_sales_value,
        COALESCE(SUM(sl.line_total_calc - sl.unit_price_value * sl.qty), 0) as total_vat_collected
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE DATE_TRUNC('month', s.dt) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Calculate growth percentages
    const currentRev = Number(currentMonth.rows[0]?.revenue || 0);
    const previousRev = Number(previousMonth.rows[0]?.revenue || 0);
    const revenueGrowth = previousRev > 0
      ? ((currentRev - previousRev) / previousRev * 100).toFixed(1)
      : '0';

    const currentUnits = Number(currentMonth.rows[0]?.units || 0);
    const previousUnits = Number(previousMonth.rows[0]?.units || 0);
    const unitsGrowth = previousUnits > 0
      ? ((currentUnits - previousUnits) / previousUnits * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      overall: {
        totalUnitsSold: Number(overallMetrics.rows[0]?.total_units_sold || 0),
        totalRevenue: Number(overallMetrics.rows[0]?.total_revenue || 0),
        totalTransactions: Number(overallMetrics.rows[0]?.total_transactions || 0),
        uniqueCustomers: Number(overallMetrics.rows[0]?.unique_customers || 0),
        productsSold: Number(overallMetrics.rows[0]?.products_sold || 0),
      },
      currentMonth: {
        units: currentUnits,
        revenue: currentRev,
        transactions: Number(currentMonth.rows[0]?.transactions || 0),
        customers: Number(currentMonth.rows[0]?.customers || 0),
        products: Number(currentMonth.rows[0]?.products || 0),
        avgPerTransaction: Number(currentMonth.rows[0]?.transactions || 0) > 0
          ? Math.round(currentRev / Number(currentMonth.rows[0]?.transactions || 1))
          : 0,
      },
      growth: {
        revenue: revenueGrowth,
        units: unitsGrowth,
      },
      topProducts: topProducts.rows.map((p: any) => ({
        name: p.name,
        category: p.category,
        qtySold: Number(p.qty_sold),
        revenue: Number(p.revenue),
      })),
      topCustomers: topCustomers.rows.map((c: any) => ({
        name: c.customer,
        transactions: Number(c.transactions),
        revenue: Number(c.revenue),
      })),
      categoryPerformance: categoryPerformance.rows.map((c: any) => ({
        category: c.category,
        products: Number(c.products),
        unitsSold: Number(c.units_sold),
        revenue: Number(c.revenue),
      })),
      monthlyTrend: monthlyTrend.rows.map((m: any) => ({
        month: m.month,
        units: Number(m.units),
        revenue: Number(m.revenue),
        transactions: Number(m.transactions),
      })),
      vat: {
        totalSalesValue: Number(vatSummary.rows[0]?.total_sales_value || 0),
        totalVatCollected: Number(vatSummary.rows[0]?.total_vat_collected || 0),
      },
    });

  } catch (error) {
    console.error('Error fetching business insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business insights' },
      { status: 500 }
    );
  }
}
