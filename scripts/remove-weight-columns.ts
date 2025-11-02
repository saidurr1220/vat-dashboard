import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function removeWeightColumns() {
    try {
        console.log('Removing weight_net column...');
        await db.execute(sql`ALTER TABLE imports_boe DROP COLUMN IF EXISTS weight_net`);

        console.log('Removing weight_gross column...');
        await db.execute(sql`ALTER TABLE imports_boe DROP COLUMN IF EXISTS weight_gross`);

        console.log('Weight columns removed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

removeWeightColumns();