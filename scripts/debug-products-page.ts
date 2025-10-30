import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

async function debugProductsPage() {
    try {
        console.log('🔍 Debugging products page data...');

        // Test the exact same queries as the page
        console.log('1. Testing products query...');
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

        console.log(`📦 Found ${productsResult.rows.length} products`);

        if (productsResult.rows.length === 0) {
            console.log('❌ No products found! This explains the blank page.');

            // Check if products table has any data at all
            const totalProducts = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
            console.log(`📊 Total products in database: ${totalProducts.rows[0]?.count || 0}`);

            if (Number(totalProducts.rows[0]?.count || 0) > 0) {
                // Show raw data
                const rawProducts = await db.execute(sql`SELECT * FROM products LIMIT 3`);
                console.log('🔍 Raw product data:');
                rawProducts.rows.forEach((product: any) => {
                    console.log(`  ID: ${product.id}, Name: ${product.name}, Category: ${product.category}`);
                });
            }
        } else {
            console.log('✅ Products found:');
            productsResult.rows.slice(0, 3).forEach((product: any) => {
                console.log(`  - ${product.name} (${product.category})`);
            });
        }

        // Test stock query
        console.log('\n2. Testing stock query...');
        const stockResult = await db.execute(sql`
          SELECT 
            product_id,
            SUM(COALESCE(qty_in::numeric, 0)) - SUM(COALESCE(qty_out::numeric, 0)) as stock
          FROM stock_ledger
          GROUP BY product_id
        `);

        console.log(`📊 Found stock data for ${stockResult.rows.length} products`);

        // Test stats query
        console.log('\n3. Testing stats query...');
        const statsResult = await db.execute(sql`
          SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN p.category::text = 'Footwear' THEN 1 END) as footwear_count,
            COUNT(CASE WHEN p.category::text = 'BioShield' THEN 1 END) as bioshield_count,
            COUNT(CASE WHEN p.category::text = 'Fan' THEN 1 END) as fan_count,
            COUNT(CASE WHEN p.category::text = 'Instrument' THEN 1 END) as instrument_count
          FROM products p
        `);

        const stats = statsResult.rows[0] as any;
        console.log(`📈 Stats: Total=${stats.total_products}, Footwear=${stats.footwear_count}`);

    } catch (error) {
        console.error('❌ Error debugging products page:', error);
    }
}

debugProductsPage();