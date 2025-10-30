#!/usr/bin/env tsx

import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function checkNewDatabase() {
    console.log('🔍 Checking new database contents...');

    try {
        // Check if tables exist
        const tables = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('\n📋 AVAILABLE TABLES:');
        console.log('===================');
        tables.rows.forEach((table: any) => {
            console.log(`- ${table.table_name}`);
        });

        // Check products count
        const productsCount = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
        console.log(`\n📦 Products: ${productsCount.rows[0]?.count || 0}`);

        // Check imports_boe count
        const importsCount = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
        console.log(`📋 BoE Imports: ${importsCount.rows[0]?.count || 0}`);

        // Check if boe_lots table exists and count
        try {
            const boeLotsCount = await db.execute(sql`SELECT COUNT(*) as count FROM boe_lots`);
            console.log(`🏭 BoE Lots: ${boeLotsCount.rows[0]?.count || 0}`);
        } catch (error) {
            console.log(`🏭 BoE Lots: Table doesn't exist`);
        }

        // Check if stock_ledger table exists and count
        try {
            const stockCount = await db.execute(sql`SELECT COUNT(*) as count FROM stock_ledger`);
            console.log(`📊 Stock Ledger: ${stockCount.rows[0]?.count || 0}`);
        } catch (error) {
            console.log(`📊 Stock Ledger: Table doesn't exist`);
        }

        // If products exist, show a few
        if (parseInt(productsCount.rows[0]?.count || '0') > 0) {
            const sampleProducts = await db.execute(sql`
                SELECT id, name, category, hs_code 
                FROM products 
                LIMIT 5
            `);

            console.log('\n📦 SAMPLE PRODUCTS:');
            sampleProducts.rows.forEach((product: any) => {
                console.log(`${product.id}. ${product.name} (${product.category})`);
            });
        }

        // If imports exist, show a few
        if (parseInt(importsCount.rows[0]?.count || '0') > 0) {
            const sampleImports = await db.execute(sql`
                SELECT boe_no, description, qty 
                FROM imports_boe 
                LIMIT 5
            `);

            console.log('\n📋 SAMPLE IMPORTS:');
            sampleImports.rows.forEach((imp: any) => {
                console.log(`BoE ${imp.boe_no}: ${imp.description} (${imp.qty})`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking database:', error);
    }
}

checkNewDatabase();