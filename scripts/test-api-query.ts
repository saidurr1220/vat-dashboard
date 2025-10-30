import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testApiQuery() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log("🔍 Testing the exact API query...");

        // Run the exact same query as the API
        const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.unit,
        p.sell_ex_vat,
        p.category,
        COALESCE((
          SELECT SUM(sl.qty_in::numeric) 
          FROM stock_ledger sl 
          WHERE sl.product_id = p.id
        ), 0) as total_stock_in,
        COALESCE((
          SELECT SUM(sls.qty::numeric) 
          FROM sales_lines sls 
          WHERE sls.product_id = p.id
        ), 0) as total_sold
      FROM products p
      ORDER BY p.id
      LIMIT 5
    `);

        console.log("\n📊 API Query Results:");
        result.rows.forEach(row => {
            const stockOnHand = Number(row.total_stock_in) - Number(row.total_sold);
            console.log(`   ${row.name}: ${row.total_stock_in} in - ${row.total_sold} sold = ${stockOnHand} on hand`);
        });

        // Check if the issue is with the column names in the Drizzle query
        console.log("\n🔍 Checking column names in stock_ledger...");
        const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stock_ledger' 
      AND column_name IN ('qty_in', 'qty_out', 'product_id')
    `);

        console.log("📋 Stock ledger columns:");
        columns.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type}`);
        });

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await pool.end();
    }
}

testApiQuery();