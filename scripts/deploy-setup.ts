import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// This script sets up the database for production deployment
async function setupProductionDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("🚀 Setting up production database...");
  console.log("Database URL:", databaseUrl.replace(/:[^:@]*@/, ':****@'));

  try {
    // Create connection
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    });
    const db = drizzle(pool);

    // Test connection
    console.log("📡 Testing database connection...");
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");

    // Check if tables exist
    console.log("🔍 Checking existing tables...");
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(`📊 Found ${tables.rows.length} existing tables:`, tables.rows.map(t => (t as any).table_name));

    // Run migrations if needed
    console.log("🔄 Running database migrations...");

    // Create closing_balance table if it doesn't exist
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

    // Create other essential tables
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

    console.log("✅ Database setup completed successfully!");

    await pool.end();

  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

setupProductionDatabase();