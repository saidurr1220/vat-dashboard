import { db, pool } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function completeReset() {
    try {
        console.log('Complete database reset...');

        // Close all existing connections
        await pool.end();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create new connection
        const { Pool } = require('pg');
        const newPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL?.includes('neon.tech')
                ? { rejectUnauthorized: false }
                : false,
        });

        // Drop and recreate table
        await newPool.query('DROP TABLE IF EXISTS imports_boe CASCADE');

        await newPool.query(`
      CREATE TABLE imports_boe (
        id SERIAL PRIMARY KEY,
        boe_no TEXT NOT NULL,
        boe_date TIMESTAMP NOT NULL,
        office_code TEXT,
        item_no TEXT NOT NULL,
        hs_code TEXT,
        description TEXT,
        assessable_value NUMERIC,
        base_vat NUMERIC,
        sd NUMERIC,
        vat NUMERIC,
        at NUMERIC,
        qty NUMERIC,
        unit TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(boe_no, item_no)
      )
    `);

        // Create indexes
        await newPool.query('CREATE INDEX imports_boe_no_idx ON imports_boe(boe_no)');
        await newPool.query('CREATE INDEX imports_boe_date_idx ON imports_boe(boe_date)');
        await newPool.query('CREATE INDEX imports_hs_code_idx ON imports_boe(hs_code)');

        // Verify
        const result = await newPool.query('SELECT COUNT(*) FROM imports_boe');
        console.log(`Table recreated. Count: ${result.rows[0].count}`);

        await newPool.end();
        console.log('Complete reset done!');

    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

completeReset();