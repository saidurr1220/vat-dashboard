import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

async function testProductsQuery() {
    try {
        console.log('🔍 Testing products query...');

        const result = await db.execute(sql`
          SELECT 
            p.id,
            p.name,
            p.category,
            p.unit,
            p.sku,
            p.hs_code as "hsCode",
            p.tests_per_kit as "testsPerKit",
            COALESCE(p.cost_ex_vat, 0) as "costExVat",
            COALESCE(p.sell_ex_vat, 0) as "sellExVat",
            COALESCE(
              (SELECT SUM(COALESCE(qty_in::numeric, 0)) - SUM(COALESCE(qty_out::numeric, 0))
               FROM stock_ledger sl 
               WHERE sl.product_id = p.id), 0
            ) as "stockOnHand",
            COALESCE(
              (SELECT SUM(COALESCE(qty::numeric, 0))
               FROM sales_lines slines
               WHERE slines.product_id = p.id), 0
            ) as "totalSold"
          FROM products p
          ORDER BY p.category, p.name
          LIMIT 3
        `);

        console.log(`✅ Query successful! Found ${result.rows.length} products`);

        result.rows.forEach((product: any) => {
            console.log(`📦 ${product.name}:`);
            console.log(`   Stock: ${product.stockOnHand} ${product.unit}`);
            console.log(`   Sold: ${product.totalSold} ${product.unit}`);
            console.log(`   Cost: ৳${product.costExVat}`);
            console.log(`   Sell: ৳${product.sellExVat}`);
            console.log(`   Category: ${product.category}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error testing products query:', error);
    }
}

testProductsQuery();