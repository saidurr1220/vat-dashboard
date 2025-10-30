import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get footwear stock from different sources

        // 1. From boe_lots (BoE page calculation)
        const boeLotsStock = await db.execute(sql`
            SELECT 
                'boe_lots' as source,
                bl.product_id,
                p.name as product_name,
                SUM(bl.closing_pairs) as total_stock
            FROM boe_lots bl
            JOIN products p ON bl.product_id = p.id
            WHERE p.category = 'Footwear'
            GROUP BY bl.product_id, p.name
            ORDER BY bl.product_id
        `);

        // 2. From products API calculation
        const productsApiStock = await db.execute(sql`
            SELECT 
                'products_api' as source,
                p.id as product_id,
                p.name as product_name,
                COALESCE((
                    SELECT SUM(bl.closing_pairs)
                    FROM boe_lots bl 
                    WHERE bl.product_id = p.id
                ), 0) as total_stock
            FROM products p
            WHERE p.category = 'Footwear'
            ORDER BY p.id
        `);

        // 3. Total stock by category from BoE lots
        const categoryTotals = await db.execute(sql`
            SELECT 
                bl.category,
                COUNT(*) as lot_count,
                SUM(bl.opening_pairs) as total_opening,
                SUM(bl.closing_pairs) as total_closing
            FROM boe_lots bl
            JOIN products p ON bl.product_id = p.id
            WHERE p.category = 'Footwear'
            GROUP BY bl.category
            ORDER BY bl.category
        `);

        // 4. Overall totals
        const overallTotals = await db.execute(sql`
            SELECT 
                COUNT(DISTINCT bl.product_id) as unique_products,
                COUNT(*) as total_lots,
                SUM(bl.opening_pairs) as grand_total_opening,
                SUM(bl.closing_pairs) as grand_total_closing
            FROM boe_lots bl
            JOIN products p ON bl.product_id = p.id
            WHERE p.category = 'Footwear'
        `);

        // 5. Sales impact
        const salesImpact = await db.execute(sql`
            SELECT 
                sl.product_id,
                p.name as product_name,
                SUM(sl.qty::numeric) as total_sold
            FROM sales_lines sl
            JOIN sales s ON sl.sale_id = s.id
            JOIN products p ON sl.product_id = p.id
            WHERE p.category = 'Footwear'
            GROUP BY sl.product_id, p.name
            ORDER BY sl.product_id
        `);

        return NextResponse.json({
            boeLotsStock: boeLotsStock.rows,
            productsApiStock: productsApiStock.rows,
            categoryTotals: categoryTotals.rows.map(row => ({
                ...row,
                lot_count: Number(row.lot_count),
                total_opening: Number(row.total_opening),
                total_closing: Number(row.total_closing)
            })),
            overallTotals: {
                ...overallTotals.rows[0],
                unique_products: Number(overallTotals.rows[0].unique_products),
                total_lots: Number(overallTotals.rows[0].total_lots),
                grand_total_opening: Number(overallTotals.rows[0].grand_total_opening),
                grand_total_closing: Number(overallTotals.rows[0].grand_total_closing)
            },
            salesImpact: salesImpact.rows.map(row => ({
                ...row,
                total_sold: Number(row.total_sold)
            }))
        });

    } catch (error) {
        console.error('Error in stock comparison:', error);
        return NextResponse.json(
            { error: 'Failed to compare stock data' },
            { status: 500 }
        );
    }
}