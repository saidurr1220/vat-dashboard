import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        console.log('🔍 Debug API: Starting products test...');

        // Test the exact same queries as the products page
        const productsResult = await db.execute(sql`
          SELECT 
            p.id,
            p.name,
            p.category::text as category,
            p.unit,
            COALESCE(p.sku, '') as sku,
            COALESCE(p.hs_code, '') as "hsCode",
            p.tests_per_kit as "testsPerKit",
            COALESCE(p.cost_ex_vat, 0) as "costExVat",
            COALESCE(p.sell_ex_vat, 0) as "sellExVat"
          FROM products p
          ORDER BY p.category, p.name
        `);

        console.log(`📦 API Debug: Found ${productsResult.rows.length} products`);

        // Get stock data
        const stockResult = await db.execute(sql`
          SELECT 
            product_id,
            SUM(COALESCE(qty_in::numeric, 0)) - SUM(COALESCE(qty_out::numeric, 0)) as stock
          FROM stock_ledger
          GROUP BY product_id
        `);

        console.log(`📊 API Debug: Found stock for ${stockResult.rows.length} products`);

        // Create lookup map
        const stockMap = new Map();
        stockResult.rows.forEach((row: any) => {
            stockMap.set(row.product_id, Number(row.stock || 0));
        });

        // Combine data
        const finalData = productsResult.rows.map((product: any) => ({
            ...product,
            stockOnHand: stockMap.get(product.id) || 0,
            totalSold: 0, // Simplified for debug
        }));

        console.log(`✅ API Debug: Returning ${finalData.length} products`);

        return NextResponse.json({
            success: true,
            count: finalData.length,
            products: finalData.slice(0, 3), // Return first 3 for debugging
            message: `Found ${finalData.length} products successfully`
        });

    } catch (error) {
        console.error('❌ API Debug Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            count: 0
        }, { status: 500 });
    }
}