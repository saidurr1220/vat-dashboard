import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function testAPI() {
    try {
        console.log('Testing database directly...');
        console.log('Script Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

        // Direct database query
        const count = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log(`Database count: ${count.rows[0].count}`);

        // Get some records if any
        const records = await db.execute(sql`SELECT id, boe_no, item_no FROM imports_boe LIMIT 5`);
        console.log('Database records:', records.rows);

        // Test API endpoint
        console.log('\nTesting API endpoint...');
        const response = await fetch('http://localhost:3000/api/imports');
        const apiData = await response.json();
        console.log(`API returned ${apiData.length} records`);

        if (apiData.length > 0) {
            console.log('First API record:', apiData[0]);
        }

    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

testAPI();