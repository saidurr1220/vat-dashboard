import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function migrateKiroToMain() {
  console.log("🔄 Migrating Kiro data to main application tables...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check if Kiro tables exist
    const kiroTablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%_kiro'
    `);

    if (kiroTablesCheck.rows.length === 0) {
      console.log("❌ No Kiro tables found. Please run 'pnpm load:json' first.");
      process.exit(1);
    }

    console.log(`✅ Found ${kiroTablesCheck.rows.length} Kiro tables`);

    // 1. Update settings from Kiro meta data
    console.log("📊 Updating settings...");
    await pool.query(`
      UPDATE settings SET
        bin = (SELECT bin FROM meta_entity_kiro LIMIT 1),
        taxpayer_name = (SELECT name FROM meta_entity_kiro LIMIT 1),
        address = (SELECT address FROM meta_entity_kiro LIMIT 1),
        updated_at = NOW()
      WHERE id = (SELECT MIN(id) FROM settings)
    `);

    // 2. Clear existing data (due to foreign key constraints)
    console.log("🧹 Clearing existing data...");
    await pool.query(`DELETE FROM sales_lines`);
    await pool.query(`DELETE FROM sales`);
    await pool.query(`DELETE FROM stock_ledger`);
    await pool.query(`DELETE FROM products`);

    console.log("📦 Migrating products...");

    await pool.query(`
      INSERT INTO products (sku, name, hs_code, category, unit, cost_ex_vat, sell_ex_vat, tests_per_kit)
      SELECT 
        sku,
        product as name,
        hs_code,
        CASE 
          WHEN category LIKE '%Footwear%' THEN 'Footwear'::category
          WHEN category LIKE '%BioShield%' THEN 'BioShield'::category
          WHEN category LIKE '%Appliance%' THEN 'Fan'::category
          ELSE 'Instrument'::category
        END as category,
        CASE 
          WHEN category LIKE '%Footwear%' THEN 'Pairs'
          WHEN category LIKE '%BioShield%' THEN 'Pc'
          ELSE 'Pc'
        END as unit,
        base_price as cost_ex_vat,
        ex_vat_price as sell_ex_vat,
        CASE WHEN category LIKE '%BioShield%' THEN 120 ELSE NULL END as tests_per_kit
      FROM products_kiro
    `);

    // 3. Populate stock data from Kiro
    console.log("📋 Migrating stock data...");

    // Add opening stock entries from stock_on_hand_kiro
    await pool.query(`
      INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
      SELECT 
        soh.boe_date,
        p.id as product_id,
        'OPENING' as ref_type,
        CONCAT('BOE-', soh.boe_no) as ref_no,
        soh.qty_on_hand as qty_in,
        0 as qty_out,
        p.cost_ex_vat as unit_cost_ex_vat
      FROM stock_on_hand_kiro soh
      JOIN products p ON p.name = soh.product
    `);

    // 4. Clear existing imports and populate from Kiro
    console.log("🚢 Migrating imports...");
    await pool.query(`DELETE FROM imports_boe`);

    await pool.query(`
      INSERT INTO imports_boe (boe_no, boe_date, office_code, item_no, hs_code, description, 
                               assessable_value, base_vat, sd, vat, at, qty, unit)
      SELECT DISTINCT ON (boe_no, boe_item)
        boe_no,
        boe_date,
        'DHK-MAIN' as office_code,
        boe_item as item_no,
        hs_code,
        product as description,
        declared_unit_value as assessable_value,
        0 as base_vat,
        0 as sd,
        (declared_unit_value * 0.15) as vat,
        0 as at,
        qty_in as qty,
        unit
      FROM stock_lots_kiro
      ORDER BY boe_no, boe_item, boe_date
    `);

    // 5. Clear existing treasury challans and populate from Kiro
    console.log("🏦 Migrating treasury challans...");
    await pool.query(`DELETE FROM treasury_challans`);

    await pool.query(`
      INSERT INTO treasury_challans (voucher_no, token_no, bank, branch, date, account_code, 
                                     amount_bdt, period_year, period_month)
      SELECT 
        challan_no as voucher_no,
        challan_no as token_no,
        bank,
        branch,
        date,
        account_code,
        amount as amount_bdt,
        EXTRACT(YEAR FROM date)::integer as period_year,
        EXTRACT(MONTH FROM date)::integer as period_month
      FROM vat_challans_kiro
    `);

    // 6. Update closing balance
    console.log("💰 Updating closing balance...");
    await pool.query(`
      INSERT INTO closing_balance (period_year, period_month, amount_bdt)
      SELECT 2025, 10, closing_balance_vat_treasury
      FROM meta_entity_kiro
      ON CONFLICT (period_year, period_month) DO UPDATE SET
        amount_bdt = EXCLUDED.amount_bdt
    `);

    // 7. Generate summary
    console.log("\n📋 MIGRATION SUMMARY");
    console.log("====================");

    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    const stockCount = await pool.query('SELECT COUNT(*) FROM stock_ledger');
    const importCount = await pool.query('SELECT COUNT(*) FROM imports_boe');
    const challanCount = await pool.query('SELECT COUNT(*) FROM treasury_challans');
    const closingBalance = await pool.query('SELECT amount_bdt FROM closing_balance WHERE period_year = 2025 AND period_month = 10');

    console.log(`✅ Products migrated: ${productCount.rows[0].count}`);
    console.log(`✅ Stock entries migrated: ${stockCount.rows[0].count}`);
    console.log(`✅ Import records migrated: ${importCount.rows[0].count}`);
    console.log(`✅ Treasury challans migrated: ${challanCount.rows[0].count}`);
    console.log(`✅ Closing balance: ৳${Number(closingBalance.rows[0]?.amount_bdt || 0).toLocaleString()}`);

    // 8. Show category breakdown
    const categoryBreakdown = await pool.query(`
      SELECT 
        p.category,
        COUNT(*) as product_count,
        COALESCE(SUM(sl.qty_in::numeric), 0) as total_stock
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      GROUP BY p.category
      ORDER BY p.category
    `);

    console.log("\n📊 Products by Category:");
    categoryBreakdown.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.product_count} products, ${Number(row.total_stock).toLocaleString()} units`);
    });

    console.log("\n🎉 Migration completed successfully!");
    console.log("🔄 The live server will now show the Kiro data!");

  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateKiroToMain();