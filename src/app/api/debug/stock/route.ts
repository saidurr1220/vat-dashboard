import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        // Get product info
        const productResult = await db.execute(sql`
            SELECT id, name, category FROM products WHERE id = ${parseInt(productId)}
        `);

        if (productResult.rows.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const product = productResult.rows[0];

        // Get stock from different sources
        const stockLedgerResult = await db.execute(sql`
            SELECT 
                COALESCE(SUM(qty_in::numeric) - SUM(qty_out::numeric), 0) as stock_ledger_stock
            FROM stock_ledger 
            WHERE product_id = ${parseInt(productId)}
        `);

        const boeLotsResult = await db.execute(sql`
            SELECT 
                COALESCE(SUM(closing_pairs), 0) as boe_lots_stock,
                COUNT(*) as lot_count
            FROM boe_lots 
            WHERE product_id = ${parseInt(productId)}
        `);

        const salesResult = await db.execute(sql`
            SELECT 
                COUNT(*) as sales_count,
                COALESCE(SUM(sl.qty::numeric), 0) as total_sold
            FROM sales_lines sl
            JOIN sales s ON sl.sale_id = s.id
            WHERE sl.product_id = ${parseInt(productId)}
        `);

        return NextResponse.json({
            product,
            stockLedgerStock: Number(stockLedgerResult.rows[0]?.stock_ledger_stock || 0),
            boeLotsStock: Number(boeLotsResult.rows[0]?.boe_lots_stock || 0),
            lotCount: Number(boeLotsResult.rows[0]?.lot_count || 0),
            salesCount: Number(salesResult.rows[0]?.sales_count || 0),
            totalSold: Number(salesResult.rows[0]?.total_sold || 0)
        });

    } catch (error) {
        console.error('Error in debug stock API:', error);
        return NextResponse.json(
            { error: 'Failed to get stock debug info' },
            { status: 500 }
        );
    }
}