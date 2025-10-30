#!/usr/bin/env tsx

import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function checkImportsTable() {
    console.log('🔍 Checking imports_boe table structure...');

    try {
        // Check table structure
        const columns = await db.execute(sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'imports_boe'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 TABLE COLUMNS:');
        console.log('=================');
        columns.rows.forEach((col: any) => {
            console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });

        // Check row count
        const count = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log(`\n📊 Total rows: ${count.rows[0]?.count || 0}`);

        // Try to select a few rows
        const sample = await db.execute(sql`
            SELECT boe_no, boe_date, description, qty 
            FROM imports_boe 
            ORDER BY boe_date DESC 
            LIMIT 5
        `);

        console.log('\n📄 SAMPLE DATA:');
        console.log('===============');
        sample.rows.forEach((row: any, index) => {
            console.log(`${index + 1}. BoE ${row.boe_no}: ${row.description}`);
            console.log(`   Date: ${row.boe_date} | Qty: ${row.qty}`);
        });

        // Test the specific query that's failing
        console.log('\n🧪 Testing problematic query...');
        const testQuery = await db.execute(sql`
            SELECT id, boe_no, boe_date, office_code, item_no, hs_code, description, 
                   assessable_value, base_vat, sd, vat, at, qty, unit 
            FROM imports_boe 
            ORDER BY boe_date DESC 
            LIMIT 5
        `);

        console.log(`✅ Query successful! Retrieved ${testQuery.rows.length} rows`);

    } catch (error) {
        console.error('❌ Error checking imports table:', error);
    }
}

checkImportsTable();