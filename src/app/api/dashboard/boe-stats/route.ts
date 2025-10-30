import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { boeLots } from '@/db/footwear-schema';
import { products } from '@/db/schema';
import { sql, eq, desc } from 'drizzle-orm';

export async function GET() {
    try {
        // Get BoE statistics
        const boeStats = await db.execute(sql`
            SELECT 
                COUNT(*) as total_lots,
                SUM(opening_pairs) as total_opening_pairs,
                SUM(closing_pairs) as total_closing_pairs,
                SUM(CAST(base_value as DECIMAL)) as total_base_value,
                SUM(CAST(sd_value as DECIMAL)) as total_sd_value,
                COUNT(DISTINCT product_id) as unique_products,
                COUNT(DISTINCT category) as unique_categories,
                COUNT(DISTINCT month) as unique_months
            FROM boe_lots
        `);

        const stats = boeStats.rows[0] as any;

        // Get recent imports (last 10)
        const recentImports = await db
            .select({
                lotId: boeLots.lotId,
                boeNumber: boeLots.boeNumber,
                boeDate: boeLots.boeDate,
                description: boeLots.description,
                category: boeLots.category,
                openingPairs: boeLots.openingPairs,
                baseValue: boeLots.baseValue,
                createdAt: boeLots.createdAt
            })
            .from(boeLots)
            .orderBy(desc(boeLots.createdAt))
            .limit(10);

        // Get category breakdown
        const categoryStats = await db.execute(sql`
            SELECT 
                category,
                COUNT(*) as lot_count,
                SUM(opening_pairs) as total_pairs,
                SUM(CAST(base_value as DECIMAL)) as total_value
            FROM boe_lots
            GROUP BY category
            ORDER BY total_value DESC
        `);

        // Get monthly breakdown (last 12 months)
        const monthlyStats = await db.execute(sql`
            SELECT 
                month,
                COUNT(*) as lot_count,
                SUM(opening_pairs) as total_pairs,
                SUM(CAST(base_value as DECIMAL)) as total_value
            FROM boe_lots
            WHERE month >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
            GROUP BY month
            ORDER BY month DESC
        `);

        // Calculate sold pairs (opening - closing)
        const soldPairs = parseInt(stats.total_opening_pairs || '0') - parseInt(stats.total_closing_pairs || '0');

        return NextResponse.json({
            summary: {
                totalLots: parseInt(stats.total_lots || '0'),
                totalOpeningPairs: parseInt(stats.total_opening_pairs || '0'),
                totalClosingPairs: parseInt(stats.total_closing_pairs || '0'),
                soldPairs: soldPairs,
                totalBaseValue: parseFloat(stats.total_base_value || '0'),
                totalSdValue: parseFloat(stats.total_sd_value || '0'),
                uniqueProducts: parseInt(stats.unique_products || '0'),
                uniqueCategories: parseInt(stats.unique_categories || '0'),
                uniqueMonths: parseInt(stats.unique_months || '0')
            },
            recentImports,
            categoryBreakdown: categoryStats.rows,
            monthlyBreakdown: monthlyStats.rows
        });

    } catch (error) {
        console.error('Error fetching BoE dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch BoE statistics' },
            { status: 500 }
        );
    }
}