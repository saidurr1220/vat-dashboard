import { Pool } from "pg";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

interface KiroDataBundle {
  meta?: {
    name?: string;
    address?: string;
    bin?: string;
    closing_balance_vat_treasury?: number;
  };
  products?: Array<{
    sku?: string;
    category: string;
    product: string;
    hs_code?: string;
    unit: string;
    base_price: number;
    ex_vat_price: number;
    vat_rate?: number;
    source: string;
    list_price_sheet?: number;
  }>;
  stock_lots?: Array<{
    boe_no: string;
    boe_date: string;
    boe_item: string;
    product: string;
    hs_code?: string;
    category: string;
    unit: string;
    qty_in: number;
    unit_purchase: number;
    declared_unit_value: number;
    source: string;
  }>;
  stock_on_hand?: Array<{
    category: string;
    product: string;
    boe_no: string;
    boe_date: string;
    qty_on_hand: number;
  }>;
  vat_challans?: Array<{
    challan_no: string;
    bank: string;
    branch: string;
    date: string;
    account_code: string;
    amount: number;
    notes?: string;
  }>;
  treasury_plan?: Array<{
    month: string;
    opening_balance?: number;
    planned_sales_vat_use?: number;
    planned_treasury_transfer?: number;
    closing_balance?: number;
  }>;
}

function parseDate(dateStr: string | null | undefined): Date {
  if (!dateStr || dateStr === null || dateStr === undefined) {
    return new Date(); // Default to current date
  }

  // Handle YYYY-MM-DD or YYYY-MM formats
  if (typeof dateStr === 'string') {
    if (dateStr.match(/^\d{4}-\d{2}$/)) {
      return new Date(`${dateStr}-01`);
    }
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateStr);
    }
  }

  // Try to parse as-is, fallback to current date if invalid
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function coerceToNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

async function createTables(pool: Pool): Promise<void> {
  console.log("🏗️  Creating tables...");

  // Drop existing views and tables if they exist
  await pool.query(`
    DROP VIEW IF EXISTS v_price_book, v_stock_position, v_boe_trace, v_vat_treasury_balance CASCADE;
    DROP TABLE IF EXISTS products_kiro, stock_lots_kiro, stock_on_hand_kiro, vat_challans_kiro, treasury_plan_kiro, meta_entity_kiro CASCADE;
  `);

  // Create tables with strict types
  await pool.query(`
    CREATE TABLE meta_entity_kiro (
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      bin TEXT NOT NULL,
      closing_balance_vat_treasury NUMERIC NOT NULL
    );

    CREATE TABLE products_kiro (
      id SERIAL PRIMARY KEY,
      sku TEXT,
      category TEXT NOT NULL,
      product TEXT NOT NULL,
      hs_code TEXT,
      unit TEXT NOT NULL,
      base_price NUMERIC NOT NULL,
      ex_vat_price NUMERIC NOT NULL,
      vat_rate NUMERIC DEFAULT 0.15,
      source TEXT NOT NULL,
      list_price_sheet NUMERIC
    );

    CREATE TABLE stock_lots_kiro (
      id SERIAL PRIMARY KEY,
      boe_no TEXT NOT NULL,
      boe_date DATE NOT NULL,
      boe_item TEXT NOT NULL,
      product TEXT NOT NULL,
      hs_code TEXT,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      qty_in NUMERIC NOT NULL,
      unit_purchase NUMERIC NOT NULL,
      declared_unit_value NUMERIC NOT NULL,
      source TEXT NOT NULL
    );

    CREATE TABLE stock_on_hand_kiro (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      product TEXT NOT NULL,
      boe_no TEXT NOT NULL,
      boe_date DATE NOT NULL,
      qty_on_hand NUMERIC NOT NULL
    );

    CREATE TABLE vat_challans_kiro (
      id SERIAL PRIMARY KEY,
      challan_no TEXT NOT NULL,
      bank TEXT NOT NULL,
      branch TEXT NOT NULL,
      date DATE NOT NULL,
      account_code TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      notes TEXT
    );

    CREATE TABLE treasury_plan_kiro (
      id SERIAL PRIMARY KEY,
      month TEXT NOT NULL,
      opening_balance NUMERIC,
      planned_sales_vat_use NUMERIC,
      planned_treasury_transfer NUMERIC,
      closing_balance NUMERIC
    );
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IDX_products_sku ON products_kiro(sku);
    CREATE INDEX IDX_products_product_hs ON products_kiro(product, hs_code);
    CREATE INDEX IDX_lots_boe ON stock_lots_kiro(boe_no, boe_item);
    CREATE INDEX IDX_lots_product ON stock_lots_kiro(product);
    CREATE INDEX IDX_onhand_boe ON stock_on_hand_kiro(boe_no, boe_date);
    CREATE INDEX IDX_challans_date ON vat_challans_kiro(date);
  `);

  console.log("✅ Tables and indexes created");
}

async function createViews(pool: Pool): Promise<void> {
  console.log("👁️  Creating views...");

  await pool.query(`
    -- Price book view
    CREATE VIEW v_price_book AS
    SELECT 
      product,
      category,
      hs_code,
      unit,
      ex_vat_price as selling_price,
      base_price as cost_price,
      COALESCE(vat_rate, 0.15) as vat_rate,
      ex_vat_price * (1 + COALESCE(vat_rate, 0.15)) as price_with_vat,
      source,
      list_price_sheet
    FROM products_kiro;

    -- Stock position view
    CREATE VIEW v_stock_position AS
    SELECT 
      soh.category,
      soh.product,
      soh.boe_no,
      soh.boe_date,
      soh.qty_on_hand,
      pb.cost_price,
      pb.selling_price,
      pb.vat_rate,
      soh.qty_on_hand * pb.cost_price as value_cost,
      soh.qty_on_hand * pb.selling_price as value_sell,
      pb.unit
    FROM stock_on_hand_kiro soh
    JOIN v_price_book pb ON soh.product = pb.product;

    -- BoE trace view
    CREATE VIEW v_boe_trace AS
    SELECT 
      boe_no,
      boe_date,
      boe_item,
      product,
      hs_code,
      category,
      unit,
      qty_in,
      unit_purchase,
      declared_unit_value,
      source
    FROM stock_lots_kiro
    ORDER BY boe_date, boe_no, boe_item;

    -- VAT treasury balance view
    CREATE VIEW v_vat_treasury_balance AS
    SELECT 
      name as entity_name,
      address,
      bin,
      closing_balance_vat_treasury as initial_balance
    FROM meta_entity_kiro;
  `);

  console.log("✅ Views created");
}

async function runIntegrityChecks(pool: Pool): Promise<void> {
  console.log("🔍 Running integrity checks...");

  // Check Fan pricing
  const fanCheck = await pool.query(`
    SELECT product, ex_vat_price 
    FROM products_kiro 
    WHERE category ILIKE '%fan%' AND ABS(ex_vat_price - 1899) > 0.01
  `);

  if (fanCheck.rows.length > 0) {
    console.log("⚠️  Fan pricing warning:");
    fanCheck.rows.forEach(row => {
      console.log(`   ${row.product}: ৳${row.ex_vat_price} (expected ৳1899)`);
    });
  }

  // Check Absorbance 96 pricing
  const absorbanceCheck = await pool.query(`
    SELECT product, ex_vat_price 
    FROM products_kiro 
    WHERE product ILIKE '%absorbance%96%' AND ABS(ex_vat_price - 524815.20) > 0.01
  `);

  if (absorbanceCheck.rows.length > 0) {
    console.log("⚠️  Absorbance 96 pricing warning:");
    absorbanceCheck.rows.forEach(row => {
      console.log(`   ${row.product}: ৳${row.ex_vat_price} (expected ৳524815.20)`);
    });
  }

  // Check BioShield test pricing
  const bioshieldCheck = await pool.query(`
    SELECT product, ex_vat_price 
    FROM products_kiro 
    WHERE category ILIKE '%bioshield%' 
    AND ex_vat_price NOT IN (273.60, 273.62)
  `);

  if (bioshieldCheck.rows.length > 0) {
    console.log("⚠️  BioShield test pricing warning:");
    bioshieldCheck.rows.forEach(row => {
      console.log(`   ${row.product}: ৳${row.ex_vat_price} (expected ৳273.60 or ৳273.62)`);
    });
  }

  console.log("✅ Integrity checks completed");
}

async function loadJsonBundle(): Promise<void> {
  console.log("🌱 Starting JSON bundle loading...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Read JSON bundle
    const jsonPath = path.join(process.cwd(), "kiro_data_bundle.json");

    if (!fs.existsSync(jsonPath)) {
      console.error("❌ kiro_data_bundle.json not found in project root");
      process.exit(1);
    }

    console.log("📖 Reading kiro_data_bundle.json...");
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as KiroDataBundle;

    console.log("📋 Data structure found:");
    console.log(`   Meta: ${jsonData.meta ? 'Present' : 'Missing'}`);
    console.log(`   Products: ${jsonData.products?.length || 0} items`);
    console.log(`   Stock Lots: ${jsonData.stock_lots?.length || 0} items`);
    console.log(`   Stock On Hand: ${jsonData.stock_on_hand?.length || 0} items`);
    console.log(`   VAT Challans: ${jsonData.vat_challans?.length || 0} items`);
    console.log(`   Treasury Plan: ${jsonData.treasury_plan?.length || 0} items`);

    // Create tables and views
    await createTables(pool);

    // Insert meta data
    console.log("📊 Inserting meta entity data...");
    await pool.query(`
      INSERT INTO meta_entity_kiro (name, address, bin, closing_balance_vat_treasury)
      VALUES ($1, $2, $3, $4)
    `, [
      jsonData.meta?.name || "M S RAHMAN TRADERS",
      jsonData.meta?.address || "174. Siddique Bazar, Dhaka; Bangshal PS; Dhaka - 1000; Bangladesh",
      jsonData.meta?.bin || "004223577-0205",
      jsonData.meta?.closing_balance_vat_treasury || 5769554.84
    ]);

    // Insert products
    console.log("📦 Inserting products...");
    for (const product of jsonData.products || []) {
      await pool.query(`
        INSERT INTO products_kiro (sku, category, product, hs_code, unit, base_price, ex_vat_price, vat_rate, source, list_price_sheet)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        product.sku || null,
        product.category,
        product.product,
        product.hs_code || null,
        product.unit,
        product.base_price,
        product.ex_vat_price,
        coerceToNumber(product.vat_rate) || 0.15,
        product.source,
        coerceToNumber(product.list_price_sheet)
      ]);
    }

    // Insert stock lots
    console.log("📋 Inserting stock lots...");
    for (const lot of jsonData.stock_lots || []) {
      try {
        await pool.query(`
          INSERT INTO stock_lots_kiro (boe_no, boe_date, boe_item, product, hs_code, category, unit, qty_in, unit_purchase, declared_unit_value, source)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          lot.boe_no,
          parseDate(lot.boe_date),
          lot.boe_item,
          lot.product,
          lot.hs_code || null,
          lot.category,
          lot.unit,
          lot.qty_in,
          lot.unit_purchase,
          lot.declared_unit_value,
          lot.source
        ]);
      } catch (error) {
        console.log(`⚠️  Error with stock lot: ${lot.boe_no}, date: ${lot.boe_date}`);
        throw error;
      }
    }

    // Insert stock on hand
    console.log("📊 Inserting stock on hand...");
    for (const stock of jsonData.stock_on_hand || []) {
      await pool.query(`
        INSERT INTO stock_on_hand_kiro (category, product, boe_no, boe_date, qty_on_hand)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        stock.category,
        stock.product,
        stock.boe_no,
        parseDate(stock.boe_date),
        stock.qty_on_hand
      ]);
    }

    // Insert VAT challans
    console.log("🏦 Inserting VAT challans...");
    for (const challan of jsonData.vat_challans || []) {
      await pool.query(`
        INSERT INTO vat_challans_kiro (challan_no, bank, branch, date, account_code, amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        challan.challan_no,
        challan.bank,
        challan.branch,
        parseDate(challan.date),
        challan.account_code,
        challan.amount,
        challan.notes || null
      ]);
    }

    // Insert treasury plan
    console.log("💰 Inserting treasury plan...");
    for (const plan of jsonData.treasury_plan || []) {
      await pool.query(`
        INSERT INTO treasury_plan_kiro (month, opening_balance, planned_sales_vat_use, planned_treasury_transfer, closing_balance)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        plan.month,
        coerceToNumber(plan.opening_balance),
        coerceToNumber(plan.planned_sales_vat_use),
        coerceToNumber(plan.planned_treasury_transfer),
        coerceToNumber(plan.closing_balance)
      ]);
    }

    // Create views
    await createViews(pool);

    // Run integrity checks
    await runIntegrityChecks(pool);

    // Generate summary report
    console.log("\n📋 SUMMARY REPORT");
    console.log("==================");

    // Product count by category
    const productsByCategory = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM products_kiro
      GROUP BY category
      ORDER BY category
    `);

    console.log("\n📦 Products by Category:");
    let totalProducts = 0;
    productsByCategory.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.count}`);
      totalProducts += parseInt(row.count);
    });
    console.log(`   TOTAL: ${totalProducts}`);

    // Stock position summary
    const stockSummary = await pool.query(`
      SELECT 
        category,
        SUM(qty_on_hand) as total_qty,
        SUM(value_cost) as total_cost_value,
        SUM(value_sell) as total_sell_value
      FROM v_stock_position
      GROUP BY category
      ORDER BY category
    `);

    console.log("\n📊 Stock Position by Category:");
    let totalCostValue = 0;
    let totalSellValue = 0;
    stockSummary.rows.forEach(row => {
      console.log(`   ${row.category}:`);
      console.log(`     Qty: ${Number(row.total_qty).toLocaleString()}`);
      console.log(`     Cost Value: ৳${Number(row.total_cost_value).toLocaleString()}`);
      console.log(`     Sell Value: ৳${Number(row.total_sell_value).toLocaleString()}`);
      totalCostValue += Number(row.total_cost_value);
      totalSellValue += Number(row.total_sell_value);
    });
    console.log(`   TOTAL Cost Value: ৳${totalCostValue.toLocaleString()}`);
    console.log(`   TOTAL Sell Value: ৳${totalSellValue.toLocaleString()}`);

    // VAT challans summary
    const vatSummary = await pool.query(`
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM vat_challans_kiro
    `);

    console.log(`\n🏦 VAT Challans: ${vatSummary.rows[0].count} challans, Total: ৳${Number(vatSummary.rows[0].total_amount).toLocaleString()}`);

    // Treasury balance
    const treasuryBalance = await pool.query(`
      SELECT closing_balance_vat_treasury
      FROM meta_entity_kiro
    `);

    console.log(`\n💰 Initial Treasury Balance: ৳${Number(treasuryBalance.rows[0].closing_balance_vat_treasury).toLocaleString()}`);

    console.log("\n✅ JSON bundle loading completed successfully!");
    console.log("\n🎯 Ready to serve API endpoints:");
    console.log("   GET /api/price-book");
    console.log("   GET /api/stock");
    console.log("   GET /api/boe/:no");
    console.log("   GET /api/vat/challans");
    console.log("   GET /api/treasury/plan");
    console.log("   GET /api/meta/entity");

  } catch (error) {
    console.error("❌ Error loading JSON bundle:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

loadJsonBundle();