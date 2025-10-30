#!/usr/bin/env tsx

import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function testConnection() {
    console.log('🔍 Testing database connection...');

    try {
        // Test basic connection
        const result = await db.execute(sql`SELECT 1 as test`);
        console.log('✅ Database connection successful!');
        console.log('Test result:', result.rows[0]);

        // Test if tables exist
        const tables = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('products', 'boe_lots', 'imports_boe')
            ORDER BY table_name
        `);

        console.log('\n📋 Available tables:');
        tables.rows.forEach((row: any) => {
            console.log(`  - ${row.table_name}`);
        });

        if (tables.rows.length === 0) {
            console.log('⚠️  No required tables found. You may need to run migrations.');
            console.log('Run: npm run db:push');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check your .env.local file has DATABASE_URL');
        console.log('2. Verify your Neon database credentials');
        console.log('3. Ensure your database is running and accessible');
        console.log('4. Run: npm run db:push to create tables');
    }
}

testConnection();