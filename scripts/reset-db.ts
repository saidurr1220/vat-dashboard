import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function resetDatabase() {
    console.log("🗑️ Resetting database...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL not found in environment variables");
        console.log("Make sure you have a .env.local file with DATABASE_URL");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Drop all tables in correct order (respecting foreign keys)
        console.log("Dropping tables...");
        await pool.query('DROP TABLE IF EXISTS sale_lines CASCADE;');
        await pool.query('DROP TABLE IF EXISTS sales CASCADE;');
        await pool.query('DROP TABLE IF EXISTS vat_ledger CASCADE;');
        await pool.query('DROP TABLE IF EXISTS closing_balance CASCADE;');
        await pool.query('DROP TABLE IF EXISTS treasury_challans CASCADE;');
        await pool.query('DROP TABLE IF EXISTS import_entries CASCADE;');
        await pool.query('DROP TABLE IF EXISTS products CASCADE;');
        await pool.query('DROP TABLE IF EXISTS settings CASCADE;');

        // Drop enums
        console.log("Dropping enums...");
        await pool.query('DROP TYPE IF EXISTS amount_type CASCADE;');
        await pool.query('DROP TYPE IF EXISTS payment_method CASCADE;');

        console.log("✅ Database reset completed!");

    } catch (error) {
        console.error("❌ Error resetting database:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

resetDatabase();