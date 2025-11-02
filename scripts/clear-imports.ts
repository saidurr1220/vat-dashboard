import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function clearImports() {
    try {
        console.log('Clearing all imports_boe data...');

        // Delete all records from imports_boe table
        const result = await db.execute(sql`DELETE FROM imports_boe`);

        console.log('All imports_boe records deleted successfully!');

        // Reset the auto-increment counter
        await db.execute(sql`ALTER SEQUENCE imports_boe_id_seq RESTART WITH 1`);

        console.log('ID sequence reset to 1');

        // Check count
        const count = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log(`Current record count: ${count.rows[0].count}`);

    } catch (error) {
        console.error('Error clearing imports:', error);
    }
    process.exit(0);
}

clearImports();