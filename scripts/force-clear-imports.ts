import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function forceClearImports() {
    try {
        console.log('Force clearing all imports_boe data...');

        // First, disable foreign key constraints temporarily
        await db.execute(sql`SET session_replication_role = replica`);

        // Truncate table (more aggressive than DELETE)
        await db.execute(sql`TRUNCATE TABLE imports_boe RESTART IDENTITY CASCADE`);

        // Re-enable foreign key constraints
        await db.execute(sql`SET session_replication_role = DEFAULT`);

        console.log('Table truncated successfully!');

        // Verify count
        const count = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log(`Current record count: ${count.rows[0].count}`);

        // Also check if there are any sequences to reset
        const sequences = await db.execute(sql`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_name LIKE '%imports_boe%'
    `);

        console.log('Related sequences:', sequences.rows);

    } catch (error) {
        console.error('Error force clearing imports:', error);
    }
    process.exit(0);
}

forceClearImports();