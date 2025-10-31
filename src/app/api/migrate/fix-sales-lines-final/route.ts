import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        // Drop and recreate the sales_lines table with the correct structure
        await db.execute(sql`
            DROP TABLE IF EXISTS sales_lines CASCADE
        `);

        await db.execute(sql`
            CREATE TABLE sales_lines (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL REFERENCES products(id),
                unit TEXT NOT NULL,
                qty NUMERIC NOT NULL,
                unit_price_value NUMERIC NOT NULL,
                amount_type TEXT,
                line_total_calc NUMERIC NOT NULL
            )
        `);

        // Create indexes
        await db.execute(sql`
            CREATE INDEX sales_lines_sale_id_idx ON sales_lines(sale_id)
        `);

        await db.execute(sql`
            CREATE INDEX sales_lines_product_id_idx ON sales_lines(product_id)
        `);

        return NextResponse.json({
            success: true,
            message: 'Sales lines table recreated with correct structure'
        });

    } catch (error) {
        console.error('Error recreating sales_lines table:', error);
        return NextResponse.json(
            {
                error: 'Failed to recreate sales_lines table',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}