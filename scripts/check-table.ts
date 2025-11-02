import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function checkTable() {
    try {
        // Check imports_boe table structure
        const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'imports_boe' 
      ORDER BY ordinal_position;
    `);

        console.log('imports_boe table structure:');
        result.rows.forEach((row: any) => {
            console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
        });

        // Check if table has any data
        const count = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log(`\nTotal records: ${count.rows[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    }

    process.exit(0);
}

checkTable();