#!/usr/bin/env tsx

import { db } from '../src/db/client';
import { products, stockLedger } from '../src/db/schema';
import { boeLots, productAliases, auditLog } from '../src/db/footwear-schema';
import { sql, eq } from 'drizzle-orm';

async function completeBoETracking() {
    console.log('🚀 Completing BoE tracking data...');

    try {
        // Get all BoE import records that don't have corresponding lots
        // Filter out malformed BoE numbers that contain semicolons or non-numeric characters
        const boeRecords = await db.execute(sql`
            SELECT 
                ib.boe_no,
                ib.item_no,
                ib.boe_date,
                ib.description,
                ib.hs_code,
                ib.assessable_value,
                ib.sd,
                ib.qty,
                ib.notes,
                p.id as product_id
            FROM imports_boe ib
            LEFT JOIN products p ON p.name = ib.description
            LEFT JOIN boe_lots bl ON bl.lot_id = (ib.boe_no || '-' || ib.item_no)
            WHERE bl.id IS NULL 
                AND p.category = 'Footwear'
                AND p.id IS NOT NULL
                AND ib.boe_no ~ '^[0-9]+$'  -- Only numeric BoE numbers
                AND ib.item_no ~ '^[0-9]+$' -- Only numeric item numbers
            ORDER BY ib.boe_no, ib.item_no
        `);

        console.log(`📄 Found ${boeRecords.rows.length} BoE records to process for lot creation`);

        let created = 0;
        let errors: string[] = [];

        for (const record of boeRecords.rows) {
            try {
                const boeRecord = record as any;

                // Parse values from notes (Category: X, Month: Y)
                const notes = boeRecord.notes || '';
                const categoryMatch = notes.match(/Category:\s*([^,]+)/);
                const monthMatch = notes.match(/Month:\s*([^,\s]+)/);

                const category = categoryMatch ? categoryMatch[1].trim() : 'unknown';
                const month = monthMatch ? monthMatch[1].trim() : new Date(boeRecord.boe_date).toISOString().substring(0, 7);

                // Create lot ID
                const lotId = `${boeRecord.boe_no}-${boeRecord.item_no}`;

                // Estimate unit purchase cost (assessable_value / qty)
                const qty = parseFloat(boeRecord.qty || '1');
                const assessableValue = parseFloat(boeRecord.assessable_value || '0');
                const unitPurchaseCost = qty > 0 ? (assessableValue / qty) : 0;

                console.log(`Creating lot ${lotId} for ${boeRecord.description}`);

                // Create BoE lot
                await db.insert(boeLots).values({
                    lotId: lotId,
                    boeNumber: parseInt(boeRecord.boe_no),
                    boeItemNo: parseInt(boeRecord.item_no),
                    boeDate: new Date(boeRecord.boe_date).toISOString().split('T')[0],
                    productId: boeRecord.product_id,
                    description: boeRecord.description,
                    hsCode: boeRecord.hs_code || '',
                    baseValue: boeRecord.assessable_value || '0',
                    sdValue: boeRecord.sd || '0',
                    unitPurchaseCost: unitPurchaseCost.toString(),
                    category: category,
                    month: month,
                    cartonSize: 0, // Unknown from import data
                    openingPairs: parseInt(boeRecord.qty || '0'),
                    closingPairs: parseInt(boeRecord.qty || '0'), // Initially same as opening
                    declaredUnitValue: unitPurchaseCost.toString()
                });

                // Create stock ledger entry
                await db.execute(sql`
                    INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
                    VALUES (${new Date(boeRecord.boe_date)}, ${boeRecord.product_id}, 'IMPORT', ${lotId}, ${boeRecord.qty}, 0, ${unitPurchaseCost})
                `);

                created++;

            } catch (error) {
                console.error(`❌ Error processing record:`, error);
                errors.push(`${record}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        // Log the completion action
        try {
            await db.insert(auditLog).values({
                action: 'complete_boe_tracking',
                entityType: 'boe_lots',
                notes: `Completed BoE tracking for ${created} lots from existing import records`,
                userId: 'system'
            });
        } catch (auditError) {
            console.log('⚠️  Could not log audit entry, but completion was successful');
        }

        console.log('\n📊 COMPLETION SUMMARY');
        console.log('====================');
        console.log(`✅ Successfully created: ${created} BoE lots`);
        console.log(`✅ Successfully created: ${created} stock ledger entries`);
        console.log(`❌ Errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log('\n❌ ERRORS:');
            errors.slice(0, 5).forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        // Get final statistics
        const finalStats = await db.execute(sql`
            SELECT 
                COUNT(*) as total_lots,
                SUM(opening_pairs) as total_pairs,
                COUNT(DISTINCT product_id) as unique_products,
                COUNT(DISTINCT category) as unique_categories
            FROM boe_lots
        `);

        const stats = finalStats.rows[0] as any;
        console.log('\n📈 FINAL STATISTICS:');
        console.log(`Total BoE lots: ${stats.total_lots}`);
        console.log(`Total pairs: ${stats.total_pairs}`);
        console.log(`Unique products: ${stats.unique_products}`);
        console.log(`Unique categories: ${stats.unique_categories}`);

        console.log('\n🎉 BoE tracking completion successful!');

    } catch (error) {
        console.error('💥 Fatal error during completion:', error);
        process.exit(1);
    }
}

// Run the completion function
if (require.main === module) {
    completeBoETracking()
        .then(() => {
            console.log('✅ BoE tracking completion process finished');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 BoE tracking completion failed:', error);
            process.exit(1);
        });
}

export { completeBoETracking };