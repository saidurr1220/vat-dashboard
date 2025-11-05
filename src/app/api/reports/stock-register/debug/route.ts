import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        // Check if we have any sales in November 2025
        const salesCheck = await db.execute(sql`
      SELECT 
        COUNT(*) as total_sales,
        COUNT(DISTINCT s.id) as total_invoices,
        COUNT(DISTINCT sl.product_id) as total_products
      FROM sales s
      JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE EXTRACT(YEAR FROM s.dt) = 2025
        AND EXTRACT(MONTH FROM s.dt) = 11
    `);

        // Check if we have any imports in November 2025
        const importsCheck = await db.execute(sql`
      SELECT 
        COUNT(*) as total_imports,
        COUNT(DISTINCT product_id) as total_products
      FROM imports_boe
      WHERE EXTRACT(YEAR FROM boe_date) = 2025
        AND EXTRACT(MONTH FROM boe_date) = 11
    `);

        // Get sample products with sales
        const sampleProducts = await db.execute(sql`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        COUNT(sl.id) as sale_lines
      FROM products p
      JOIN sales_lines sl ON p.id = sl.product_id
      JOIN sales s ON sl.sale_id = s.id
      WHERE EXTRACT(YEAR FROM s.dt) = 2025
        AND EXTRACT(MONTH FROM s.dt) = 11
      GROUP BY p.id, p.sku, p.name, p.category
      LIMIT 5
    `);

        return NextResponse.json({
            november_2025: {
                sales: salesCheck.rows[0],
                imports: importsCheck.rows[0],
                sample_products: sampleProducts.rows
            }
        });

    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json(
            {
                error: 'Debug failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
