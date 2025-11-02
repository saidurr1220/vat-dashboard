import 'dotenv/config';
import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function fixMissingColumn() {
    try {
        console.log('Adding missing created_by column...');

        await db.execute(sql`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by integer;
    `);

        console.log('Column added successfully!');

        // Test the column exists now
        const test = await db.execute(sql`
      SELECT created_by FROM sales LIMIT 1;
    `);

        console.log('Column test successful!');
    } catch (error) {
        console.error('Failed to add column:', error);
    }
}

fixMissingColumn();