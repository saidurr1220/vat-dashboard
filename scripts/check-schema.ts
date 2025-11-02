import 'dotenv/config';
import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function checkSchema() {
    try {
        console.log('Checking database schema...\n');

        // Check if auth tables exist
        const authTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'audit_logs')
      ORDER BY table_name;
    `);

        console.log('Auth tables:', authTables.rows);

        // Check sales table columns
        const salesColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales'
      ORDER BY ordinal_position;
    `);

        console.log('\nSales table columns:');
        salesColumns.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check if role enum exists
        const roleEnum = await db.execute(sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'role'
      );
    `);

        console.log('\nRole enum values:', roleEnum.rows);

        // Test a simple sales query
        console.log('\nTesting sales query...');
        const salesTest = await db.execute(sql`
      SELECT id, invoice_no, dt, customer, total_value, created_by
      FROM sales 
      LIMIT 1;
    `);

        console.log('Sales query successful:', salesTest.rows.length > 0 ? 'Yes' : 'No data');

    } catch (error) {
        console.error('Schema check failed:', error);
    }
}

checkSchema();