import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Find products with stock but no import records
        const result = await db.execute(sql`
            SELECT 
                p.id,
                p.name,
                p.category,
                p.stock_on_hand,
                p.boe_no,
                p.sell_ex_vat,
                COUNT(DISTINCT ib.id) as import_count
            FROM products p
            LEFT JOIN imports_boe ib ON p.boe_no = ib.boe_no
            WHERE p.stock_on_hand > 0
            GROUP BY p.id, p.name, p.category, p.stock_on_hand, p.boe_no, p.sell_ex_vat
            HAVING COUNT(DISTINCT ib.id) = 0
            ORDER BY p.stock_on_hand DESC
        `);

        return NextResponse.json({
            success: true,
            count: result.rows.length,
            products: result.rows
        });
    } catch (error) {
        console.error('Error finding products without imports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
