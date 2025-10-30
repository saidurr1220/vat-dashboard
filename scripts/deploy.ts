#!/usr/bin/env tsx

/**
 * Deployment preparation script
 * This script prepares the application for deployment by:
 * 1. Checking environment variables
 * 2. Running build tests
 * 3. Validating database connection
 */

import { config } from 'dotenv';
import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

// Load environment variables
config();

async function checkEnvironment() {
    console.log('🔍 Checking environment variables...');

    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        process.exit(1);
    }

    console.log('✅ Environment variables check passed');
}

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');

    try {
        const result = await db.execute(sql`SELECT 1 as test`);
        if (result.rows.length > 0) {
            console.log('✅ Database connection successful');
        } else {
            throw new Error('No result from database');
        }
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

async function checkTables() {
    console.log('🔍 Checking database tables...');

    try {
        const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        const tableNames = tables.rows.map((row: any) => row.table_name);
        console.log('📋 Found tables:', tableNames.join(', '));

        const requiredTables = ['products', 'customers', 'sales', 'sales_lines', 'settings'];
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));

        if (missingTables.length > 0) {
            console.warn('⚠️  Missing tables (will be created on first run):', missingTables.join(', '));
        } else {
            console.log('✅ All required tables exist');
        }
    } catch (error) {
        console.error('❌ Error checking tables:', error);
        process.exit(1);
    }
}

async function main() {
    console.log('🚀 VAT Dashboard - Deployment Preparation\n');

    try {
        await checkEnvironment();
        await testDatabaseConnection();
        await checkTables();

        console.log('\n✅ Deployment preparation completed successfully!');
        console.log('🌐 Ready for Vercel deployment');

    } catch (error) {
        console.error('\n❌ Deployment preparation failed:', error);
        process.exit(1);
    }
}

main();