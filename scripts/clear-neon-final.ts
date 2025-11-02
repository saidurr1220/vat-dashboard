// Load environment variables
require('dotenv').config({ path: '.env.local' });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from 'drizzle-orm';

async function clearNeonFinal() {
    try {
        console.log('Clearing Neon database (final attempt)...');
        console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

        // Create direct connection to Neon
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const db = drizzle(pool);

        // Check current count
        const beforeCount = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log('Before clear count:', beforeCount.rows[0].count);

        // Delete all records
        await db.execute(sql`DELETE FROM imports_boe`);

        // Reset sequence
        await db.execute(sql`ALTER SEQUENCE imports_boe_id_seq RESTART WITH 1`);

        // Check after count
        const afterCount = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log('After clear count:', afterCount.rows[0].count);

        await pool.end();
        console.log('Neon database cleared successfully!');

    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

clearNeonFinal();