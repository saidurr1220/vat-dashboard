import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

// Production Neon database URL - Use environment variable
const PRODUCTION_DB_URL = process.env.DATABASE_URL || "";

async function setupProductionDatabase() {
  console.log("🚀 Setting up production database on Neon...");

  try {
    // Create connection to production database
    const pool = new Pool({
      connectionString: PRODUCTION_DB_URL,
      ssl: { rejectUnauthorized: false },
    });
    const db = drizzle(pool);

    // Test connection
    console.log("📡 Testing production database connection...");
    await db.execute(sql`SELECT 1`);
    console.log("✅ Production database connection successful");

    // Check existing tables
    console.log("🔍 Checking existing tables...");
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(`📊 Found ${tables.rows.length} existing tables:`, tables.rows.map(t => (t as any).table_name));

    // Create essential tables for VAT dashboard
    console.log("🔄 Creating essential tables...");

    // Create closing_balance table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS closing_balance (
        id SERIAL PRIMARY KEY,
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        opening_balance DECIMAL(15,2) DEFAULT 0,
        current_month_addition DECIMAL(15,2) DEFAULT 0,
        used_amount DECIMAL(15,2) DEFAULT 0,
        closing_balance DECIMAL(15,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(period_year, period_month)
      )
    `);
    console.log("✅ Created closing_balance table");

    // Create monthly_sales table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS monthly_sales (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        total_gross DECIMAL(15,2) DEFAULT 0,
        total_net DECIMAL(15,2) DEFAULT 0,
        total_vat DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(year, month)
      )
    `);
    console.log("✅ Created monthly_sales table");

    // Create vat_computations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vat_computations (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        gross_sales DECIMAL(15,2) DEFAULT 0,
        net_sales_ex_vat DECIMAL(15,2) DEFAULT 0,
        vat_payable DECIMAL(15,2) DEFAULT 0,
        used_from_closing_balance DECIMAL(15,2) DEFAULT 0,
        treasury_needed DECIMAL(15,2) DEFAULT 0,
        locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(year, month)
      )
    `);
    console.log("✅ Created vat_computations table");

    // Create sales table (basic structure for dashboard)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        invoice_no VARCHAR(50) UNIQUE NOT NULL,
        dt DATE NOT NULL,
        customer_name VARCHAR(255),
        total_value DECIMAL(15,2) NOT NULL,
        amount_type VARCHAR(10) DEFAULT 'EXCL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created sales table");

    // Create vat_ledger table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vat_ledger (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT,
        amount DECIMAL(15,2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created vat_ledger table");

    // Create treasury_challans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS treasury_challans (
        id SERIAL PRIMARY KEY,
        voucher_no VARCHAR(50),
        token_no VARCHAR(50) NOT NULL,
        bank VARCHAR(100),
        branch VARCHAR(100),
        date DATE NOT NULL,
        account_code VARCHAR(50) NOT NULL,
        amount_bdt DECIMAL(15,2) NOT NULL,
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created treasury_challans table");

    // Insert sample data for testing
    console.log("📝 Inserting sample data...");

    // Sample closing balance entry
    await db.execute(sql`
      INSERT INTO closing_balance (period_year, period_month, opening_balance, current_month_addition, used_amount, closing_balance, notes)
      VALUES (2024, 12, 0, 1000000, 200000, 800000, 'Initial production setup')
      ON CONFLICT (period_year, period_month) DO NOTHING
    `);

    // Sample monthly sales entry
    await db.execute(sql`
      INSERT INTO monthly_sales (year, month, total_gross, total_net, total_vat)
      VALUES (2024, 12, 1200000, 1000000, 200000)
      ON CONFLICT (year, month) DO NOTHING
    `);

    console.log("✅ Production database setup completed successfully!");
    console.log("🌐 Your VAT dashboard should now work on Vercel!");

    await pool.end();

  } catch (error) {
    console.error("❌ Production database setup failed:", error);
    process.exit(1);
  }
}

setupProductionDatabase();