import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixStockData() {
    console.log("🔧 Fixing stock data from Kiro...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Check if Kiro tables exist
        const kiroTablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'stock_on_hand_kiro'
    `);

        if (kiroTablesCheck.rows.length === 0) {
            console.log("❌ Kiro stock tables not found. Please run 'pnpm load:json' first.");
            process.exit(1);
        }

        console.log("✅ Found Kiro stock tables");

        // Clear existing stock ledger
        console.log("🧹 Clearing existing stock ledger...");
        await pool.query(`DELETE FROM stock_ledger`);

        // Insert correct stock data from Kiro stock_on_hand
        console.log("📋 Inserting correct stock data from Kiro...");

        const insertResult = await pool.query(`
      INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
      SELECT 
        soh.boe_date as dt,
        p.id as product_id,
        'OPENING' as ref_type,
        CONCAT('BOE-', soh.boe_no, '-', soh.boe_date) as ref_no,
        soh.qty_on_hand as qty_in,
        0 as qty_out,
        COALESCE(p.cost_ex_vat, 0) as unit_cost_ex_vat
      FROM stock_on_hand_kiro soh
      JOIN products p ON p.name = soh.product
      WHERE soh.qty_on_hand > 0
      ORDER BY soh.boe_date, soh.boe_no
    `);

        console.log(`✅ Inserted ${insertResult.rowCount} stock entries`);

        // Generate summary by product
        console.log("\n📊 Stock Summary by Product:");

        const stockSummary = await pool.query(`
      SELECT 
        p.name,
        p.category,
        p.unit,
        COALESCE(SUM(sl.qty_in), 0) as total_stock,
        COUNT(sl.id) as lot_count,
        p.sell_ex_vat as unit_price
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      GROUP BY p.id, p.name, p.category, p.unit, p.sell_ex_vat
      HAVING COALESCE(SUM(sl.qty_in), 0) > 0
      ORDER BY p.category, total_stock DESC
    `);

        let totalValue = 0;
        let totalUnits = 0;

        stockSummary.rows.forEach(row => {
            const value = Number(row.total_stock) * Number(row.unit_price);
            totalValue += value;
            totalUnits += Number(row.total_stock);

            console.log(`   ${row.category} | ${row.name.substring(0, 40).padEnd(40)} | ${Number(row.total_stock).toLocaleString().padStart(8)} ${row.unit} | ${row.lot_count} lots | ৳${value.toLocaleString()}`);
        });

        console.log(`\n📈 TOTALS:`);
        console.log(`   Total Units: ${totalUnits.toLocaleString()}`);
        console.log(`   Total Value: ৳${totalValue.toLocaleString()}`);
        console.log(`   Products with Stock: ${stockSummary.rows.length}`);

        // Show category breakdown
        const categoryBreakdown = await pool.query(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(sl.qty_in), 0) as total_units,
        COALESCE(SUM(sl.qty_in * p.sell_ex_vat), 0) as total_value
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      GROUP BY p.category
      HAVING COALESCE(SUM(sl.qty_in), 0) > 0
      ORDER BY total_value DESC
    `);

        console.log(`\n📊 Stock by Category:`);
        categoryBreakdown.rows.forEach(row => {
            console.log(`   ${row.category}: ${Number(row.total_units).toLocaleString()} units, ৳${Number(row.total_value).toLocaleString()} value`);
        });

        console.log("\n🎉 Stock data fixed successfully!");
        console.log("🔄 The application will now show correct stock quantities!");

    } catch (error) {
        console.error("❌ Error fixing stock data:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixStockData();