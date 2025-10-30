import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products } from '@/db/schema';
import { boeLots } from '@/db/footwear-schema';
import { sql, eq } from 'drizzle-orm';

export async function GET() {
    try {
        // Get footwear stock summary
        const stockSummary = await db.execute(sql`
            SELECT 
                p.name as product_name,
                p.category,
                COUNT(bl.id) as lot_count,
                SUM(bl.opening_pairs) as total_opening_pairs,
                SUM(bl.closing_pairs) as total_closing_pairs,
                bl.category as footwear_category
            FROM products p
            LEFT JOIN boe_lots bl ON p.id = bl.product_id
            WHERE p.category = 'Footwear'
            GROUP BY p.id, p.name, p.category, bl.category
            ORDER BY bl.category, p.name
        `);

        // Get category totals
        const categoryTotals = await db.execute(sql`
            SELECT 
                bl.category as footwear_category,
                COUNT(bl.id) as lot_count,
                SUM(bl.closing_pairs) as total_pairs,
                COUNT(DISTINCT bl.product_id) as unique_products
            FROM boe_lots bl
            GROUP BY bl.category
            ORDER BY bl.category
        `);

        return NextResponse.json({
            success: true,
            stockSummary: stockSummary.rows,
            categoryTotals: categoryTotals.rows,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching footwear stock:', error);
        return NextResponse.json(
            { error: 'Failed to fetch footwear stock' },
            { status: 500 }
        );
    }
}