import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        // Simple test - get November 2025 sales
        const result = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COUNT(sl.id) as sale_count,
        SUM(sl.qty) as total_qty
      FROM products p
      JOIN sales_lines sl ON p.id = sl.product_id
      JOIN sales s ON sl.sale_id = s.id
      WHERE EXTRACT(YEAR FROM s.dt) = 2025
        AND EXTRACT(MONTH FROM s.dt) = 11
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_qty DESC
      LIMIT 10
    `);

        return NextResponse.json({
            message: 'Top 10 products sold in November 2025',
            count: result.rows.length,
            products: result.rows
        });

    } catch (error) {
        console.error('Test error:', error);
        return NextResponse.json(
            {
                error: 'Test failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
