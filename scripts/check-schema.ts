import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function checkSchema() {
    console.log("🔍 Checking actual database schema...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Check sales table structure
        const salesColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'sales' 
            ORDER BY ordinal_position
        `);

        console.log("📋 Sales table columns:");
        salesColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // Check customers table structure
        const customersColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'customers' 
            ORDER BY ordinal_position
        `);

        console.log("\n📋 Customers table columns:");
        customersColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

    } catch (error) {
        console.error("❌ Schema check failed:", error);
    } finally {
        await pool.end();
    }
}

checkSchema();