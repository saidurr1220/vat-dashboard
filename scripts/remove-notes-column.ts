import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function removeNotesColumn() {
    try {
        console.log('Removing notes column...');
        await db.execute(sql`ALTER TABLE imports_boe DROP COLUMN IF EXISTS notes`);

        console.log('Notes column removed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

removeNotesColumn();