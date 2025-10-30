#!/usr/bin/env tsx

import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function checkExistingData() {
    console.log('🔍 Checking existing BoE data in database...');

    try {
        // Check products
        const products = await db.execute(sql`
            SELECT id, name, category, hs_code, cost_ex_vat, sell_ex_vat
            FROM products 
            WHERE category = 'Footwear'
            ORDER BY id
        `);

        console.log('\n📦 FOOTWEAR PRODUCTS:');
        console.log('====================');
        products.rows.forEach((product: any) => {
            console.log(`${product.id}. ${product.name}`);
            console.log(`   Category: ${product.category} | HS: ${product.hs_code}`);
            console.log(`   Cost: ৳${product.cost_ex_vat} | Sell: ৳${product.sell_ex_vat}`);
            console.log('');
        });

        // Check BoE imports
        const boeImports = await db.execute(sql`
            SELECT boe_no, item_no, description, qty, assessable_value
            FROM imports_boe
            ORDER BY boe_no, item_no
        `);

        console.log('\n📋 BOE IMPORT RECORDS:');
        console.log('======================');
        boeImports.rows.forEach((boe: any) => {
            console.log(`BoE ${boe.boe_no}-${boe.item_no}: ${boe.description}`);
            console.log(`   Qty: ${boe.qty} | Value: ৳${boe.assessable_value}`);
        });

        // Check BoE lots
        const boeLots = await db.execute(sql`
            SELECT lot_id, boe_number, boe_item_no, description, opening_pairs, closing_pairs, unit_purchase_cost
            FROM boe_lots
            ORDER BY boe_number, boe_item_no
        `);

        console.log('\n🏭 BOE LOTS (FIFO TRACKING):');
        console.log('============================');
        boeLots.rows.forEach((lot: any) => {
            console.log(`Lot ${lot.lot_id}: ${lot.description}`);
            console.log(`   Opening: ${lot.opening_pairs} | Closing: ${lot.closing_pairs} | Cost: ৳${lot.unit_purchase_cost}`);
        });

        // Check stock ledger
        const stockLedger = await db.execute(sql`
            SELECT p.name, sl.ref_type, sl.ref_no, sl.qty_in, sl.qty_out, sl.unit_cost_ex_vat
            FROM stock_ledger sl
            JOIN products p ON sl.product_id = p.id
            WHERE p.category = 'Footwear'
            ORDER BY p.name, sl.dt
        `);

        console.log('\n📊 STOCK LEDGER ENTRIES:');
        console.log('========================');
        stockLedger.rows.forEach((entry: any) => {
            console.log(`${entry.name}: ${entry.ref_type} ${entry.ref_no || ''}`);
            console.log(`   In: ${entry.qty_in || 0} | Out: ${entry.qty_out || 0} | Cost: ৳${entry.unit_cost_ex_vat || 0}`);
        });

        // Summary statistics
        console.log('\n📈 SUMMARY STATISTICS:');
        console.log('======================');
        console.log(`Footwear Products: ${products.rows.length}`);
        console.log(`BoE Import Records: ${boeImports.rows.length}`);
        console.log(`BoE Lots: ${boeLots.rows.length}`);
        console.log(`Stock Ledger Entries: ${stockLedger.rows.length}`);

        if (products.rows.length > 0 && boeImports.rows.length === 0 && boeLots.rows.length === 0) {
            console.log('\n⚠️  ISSUE DETECTED:');
            console.log('Products exist but no BoE data found.');
            console.log('This suggests the BoE import process was partially completed.');
            console.log('You may need to complete the BoE lot creation manually.');
        } else if (products.rows.length > 0 && boeLots.rows.length > 0) {
            console.log('\n✅ DATA STATUS: Complete');
            console.log('Both products and BoE tracking data are present.');
        }

    } catch (error) {
        console.error('❌ Error checking data:', error);
    }
}

checkExistingData();