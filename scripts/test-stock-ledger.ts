import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testStockLedger() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log("🔍 Testing stock ledger data...");

        // Check total entries in stock ledger
        const totalEntries = await pool.query(`SELECT COUNT(*) FROM stock_ledger`);
        console.log(`📊 Total stock ledger entries: ${totalEntries.rows[0].count}`);

        // Check sample entries
        const sampleEntries = await pool.query(`
      SELECT 
        sl.id,
        sl.dt,
        p.name as product_name,
        sl.ref_type,
        sl.ref_no,
        sl.qty_in,
        sl.qty_out
      FROM stock_ledger sl
      JOIN products p ON sl.product_id = p.id
      ORDER BY sl.qty_in DESC
      LIMIT 5
    `);

        console.log("\n📋 Sample stock ledger entries:");
        sampleEntries.rows.forEach(row => {
            console.log(`   ${row.product_name}: +${row.qty_in} -${row.qty_out} (${row.ref_type}: ${row.ref_no})`);
        });

        // Check stock calculation for specific products
        const stockCalc = await pool.query(`
      SELECT 
        p.name,
        COALESCE(SUM(sl.qty_in), 0) as total_in,
        COALESCE(SUM(sl.qty_out), 0) as total_out,
        COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0) as calculated_stock
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      GROUP BY p.id, p.name
      HAVING COALESCE(SUM(sl.qty_in), 0) > 0
      ORDER BY calculated_stock DESC
      LIMIT 5
    `);

        console.log("\n📊 Stock calculation for products with stock:");
        stockCalc.rows.forEach(row => {
            console.log(`   ${row.name}: ${row.total_in} in - ${row.total_out} out = ${row.calculated_stock} on hand`);
        });

        // Check if there are any sales that might be reducing stock
        const salesCheck = await pool.query(`
      SELECT COUNT(*) as sales_count, COALESCE(SUM(qty::numeric), 0) as total_qty_sold
      FROM sales_lines
    `);

        console.log(`\n💰 Sales check: ${salesCheck.rows[0].sales_count} sales lines, ${salesCheck.rows[0].total_qty_sold} total qty sold`);

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await pool.end();
    }
}

testStockLedger();