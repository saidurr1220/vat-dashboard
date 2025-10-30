import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function checkProductNames() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log("🔍 Checking product name matching...");

        // Get sample products from main table
        const mainProducts = await pool.query(`
      SELECT name FROM products LIMIT 5
    `);

        console.log("\n📦 Sample products in main table:");
        mainProducts.rows.forEach(row => {
            console.log(`   "${row.name}"`);
        });

        // Get sample products from Kiro stock table
        const kiroProducts = await pool.query(`
      SELECT DISTINCT product FROM stock_on_hand_kiro LIMIT 5
    `);

        console.log("\n📋 Sample products in Kiro stock table:");
        kiroProducts.rows.forEach(row => {
            console.log(`   "${row.product}"`);
        });

        // Check for exact matches
        const matches = await pool.query(`
      SELECT 
        p.name as main_product,
        soh.product as kiro_product,
        soh.qty_on_hand
      FROM products p
      JOIN stock_on_hand_kiro soh ON p.name = soh.product
      LIMIT 5
    `);

        console.log(`\n🔗 Exact matches found: ${matches.rows.length}`);
        matches.rows.forEach(row => {
            console.log(`   "${row.main_product}" = "${row.kiro_product}" (${row.qty_on_hand} units)`);
        });

        // Check for similar matches (case insensitive)
        const similarMatches = await pool.query(`
      SELECT 
        p.name as main_product,
        soh.product as kiro_product,
        soh.qty_on_hand
      FROM products p
      JOIN stock_on_hand_kiro soh ON UPPER(p.name) = UPPER(soh.product)
      LIMIT 5
    `);

        console.log(`\n🔗 Case-insensitive matches found: ${similarMatches.rows.length}`);
        similarMatches.rows.forEach(row => {
            console.log(`   "${row.main_product}" ≈ "${row.kiro_product}" (${row.qty_on_hand} units)`);
        });

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await pool.end();
    }
}

checkProductNames();