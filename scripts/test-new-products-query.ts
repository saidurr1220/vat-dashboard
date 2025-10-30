import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

async function testNewProductsQuery() {
    try {
        console.log('🔍 Testing new products query approach...');

        // Test basic products query
        console.log('1. Testing basic products query...');
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
          LIMIT 3
        `);
        console.log(`✅ Products query successful! Found ${productsResult.rows.length} products`);

        // Test stock query
        console.log('2. Testing stock query...');
        const stockResult = await db.execute(sql`
          SELECT 
            product_id,
            SUM(COALESCE(qty_in::numeric, 0)) - SUM(COALESCE(qty_out::numeric, 0)) as stock
          FROM stock_ledger
          GROUP BY product_id
          LIMIT 5
        `);
        console.log(`✅ Stock query successful! Found ${stockResult.rows.length} stock records`);

        // Test sales query
        console.log('3. Testing sales query...');
        const salesResult = await db.execute(sql`
          SELECT 
            product_id,
            SUM(COALESCE(qty::numeric, 0)) as total_sold
          FROM sales_lines
          GROUP BY product_id
          LIMIT 5
        `);
        console.log(`✅ Sales query successful! Found ${salesResult.rows.length} sales records`);

        // Show combined result
        console.log('\n📦 Combined results:');
        productsResult.rows.forEach((product: any) => {
            const stockRecord = stockResult.rows.find((s: any) => s.product_id === product.id);
            const salesRecord = salesResult.rows.find((s: any) => s.product_id === product.id);

            console.log(`${product.name}:`);
            console.log(`   Stock: ${stockRecord?.stock || 0} ${product.unit}`);
            console.log(`   Sold: ${salesRecord?.total_sold || 0} ${product.unit}`);
            console.log(`   Category: ${product.category}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error testing new products query:', error);
    }
}

testNewProductsQuery();