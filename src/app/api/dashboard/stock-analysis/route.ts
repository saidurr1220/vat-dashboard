import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get total units sold and revenue (all time)
        const totalStatsQuery = await db.execute(sql`
      SELECT 
        COALESCE(SUM(sl.qty), 0) as total_units_sold,
        COALESCE(SUM(s.total_value), 0) as total_revenue
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
    `);

        const totalStats = totalStatsQuery.rows[0];
        const totalUnitsSold = Number(totalStats?.total_units_sold || 0);
        const totalRevenue = Number(totalStats?.total_revenue || 0);

        // Get monthly average
        const monthlyAvgQuery = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT DATE_TRUNC('month', s.dt)) as month_count,
        COALESCE(SUM(sl.qty), 0) as total_units
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE s.dt >= CURRENT_DATE - INTERVAL '1 year'
    `);

        const monthlyAvg = monthlyAvgQuery.rows[0];
        const monthCount = Number(monthlyAvg?.month_count || 1);
        const avgMonthlySales = Math.round(Number(monthlyAvg?.total_units || 0) / monthCount);

        // Get current month stats
        const currentMonthQuery = await db.execute(sql`
      SELECT 
        COALESCE(SUM(sl.qty), 0) as units,
        COALESCE(SUM(s.total_value), 0) as revenue,
        COUNT(DISTINCT s.id) as transactions,
        COUNT(DISTINCT sl.product_id) as products
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE DATE_TRUNC('month', s.dt) = DATE_TRUNC('month', CURRENT_DATE)
    `);

        const currentMonth = currentMonthQuery.rows[0];
        const units = Number(currentMonth?.units || 0);
        const revenue = Number(currentMonth?.revenue || 0);
        const transactions = Number(currentMonth?.transactions || 0);
        const avgPerSale = transactions > 0 ? Math.round(revenue / transactions) : 0;

        return NextResponse.json({
            totalUnitsSold,
            totalRevenue,
            avgMonthlySales,
            currentMonth: {
                units,
                revenue,
                avgPerSale,
                transactions,
                products: Number(currentMonth?.products || 0),
            },
        });
    } catch (error) {
        console.error('Error fetching stock analysis:', error);

        // Return empty data instead of error
        return NextResponse.json({
            totalUnitsSold: 0,
            totalRevenue: 0,
            avgMonthlySales: 0,
            currentMonth: {
                units: 0,
                revenue: 0,
                avgPerSale: 0,
                transactions: 0,
                products: 0,
            },
        });
    }
}
