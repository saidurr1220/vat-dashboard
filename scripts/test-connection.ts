import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testConnection() {
    console.log("🔌 Testing database connection...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL not found");
        process.exit(1);
    }

    console.log("Database URL:", process.env.DATABASE_URL);

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log("✅ Connection successful!");
        console.log("Current time:", result.rows[0].current_time);

        // Test if we can create a simple table
        await pool.query('CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT)');
        await pool.query('DROP TABLE IF EXISTS test_table');
        console.log("✅ Table operations successful!");

    } catch (error) {
        console.error("❌ Connection failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testConnection();