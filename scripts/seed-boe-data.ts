#!/usr/bin/env tsx

import { db } from '../src/db/client';
import { products, importsBoe, stockLedger } from '../src/db/schema';
import { boeLots, productAliases, auditLog } from '../src/db/footwear-schema';
import { sql, eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface BoEImportData {
    BoEDate: string;
    BoENumber: number;
    BoEItemNo: number;
    Description: string;
    HS: string;
    Base: number;
    SD: number;
    UnitPurchase: number;
    Category: string;
    Month: string;
    CartonSize: number;
    PairsFinal: number;
    DeclaredUnitValue: number;
}

async function seedBoEData() {
    console.log('🚀 Starting BoE data seeding process...');

    try {
        // Read the JSON file
        const jsonPath = path.join(process.cwd(), 'boe_import_data.json');

        if (!fs.existsSync(jsonPath)) {
            throw new Error(`JSON file not found at: ${jsonPath}`);
        }

        console.log(`📁 Reading file from: ${jsonPath}`);
        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        console.log(`📄 File size: ${fileContent.length} characters`);

        const parsedJson = JSON.parse(fileContent);
        console.log(`🔍 Parsed JSON keys: ${Object.keys(parsedJson)}`);

        // Handle both direct array and wrapped object formats
        let importData: BoEImportData[];
        if (Array.isArray(parsedJson)) {
            importData = parsedJson;
        } else if (parsedJson.data && Array.isArray(parsedJson.data)) {
            importData = parsedJson.data;
            console.log(`📦 Using data property from wrapper object`);
        } else {
            throw new Error('JSON file must contain an array of BoE entries or have a "data" property with an array');
        }

        console.log(`🔍 Final data type: ${typeof importData}, length: ${importData?.length}`);

        console.log(`📄 Found ${importData.length} BoE entries to import`);

        let imported = 0;
        let errors: string[] = [];
        let createdProducts: string[] = [];
        let skippedDuplicates = 0;

        // Process entries one by one
        for (let i = 0; i < importData.length; i++) {
            const entry = importData[i];
            const rowNum = i + 1;

            try {
                console.log(`Processing entry ${rowNum}/${importData.length}: BoE ${entry.BoENumber}-${entry.BoEItemNo}`);

                // Validate required fields
                if (!entry.BoEDate || !entry.BoENumber || !entry.BoEItemNo || !entry.Description) {
                    errors.push(`Row ${rowNum}: Missing required fields`);
                    continue;
                }

                // Parse date
                const boeDate = new Date(entry.BoEDate);
                if (isNaN(boeDate.getTime())) {
                    errors.push(`Row ${rowNum}: Invalid BoE date format`);
                    continue;
                }

                // Create lot ID
                const lotId = `${entry.BoENumber}-${entry.BoEItemNo}`;

                // Check for duplicate lot
                const existingLot = await db
                    .select()
                    .from(boeLots)
                    .where(eq(boeLots.lotId, lotId))
                    .limit(1);

                if (existingLot.length > 0) {
                    console.log(`⚠️  Skipping duplicate lot ${lotId}`);
                    skippedDuplicates++;
                    continue;
                }

                // Find or create product
                let product = await db
                    .select()
                    .from(products)
                    .where(eq(products.name, entry.Description))
                    .limit(1);

                let productId: number;

                if (product.length === 0) {
                    // Create new product
                    console.log(`➕ Creating new product: ${entry.Description}`);
                    const newProduct = await db
                        .insert(products)
                        .values({
                            name: entry.Description,
                            hsCode: entry.HS || '',
                            category: 'Footwear',
                            unit: 'Pair',
                            costExVat: entry.UnitPurchase?.toString() || '0',
                            sellExVat: entry.DeclaredUnitValue?.toString() || '0',
                        })
                        .returning();

                    productId = newProduct[0].id;
                    createdProducts.push(entry.Description);

                    // Create product alias for description normalization
                    await db.insert(productAliases).values({
                        aliasText: entry.Description.toLowerCase(),
                        productId: productId
                    });
                } else {
                    productId = product[0].id;
                    console.log(`✅ Using existing product: ${entry.Description} (ID: ${productId})`);
                }

                // Insert BoE import record for BoE page
                await db.insert(importsBoe).values({
                    boeNo: entry.BoENumber.toString(),
                    boeDate: boeDate,
                    itemNo: entry.BoEItemNo.toString(),
                    hsCode: entry.HS || '',
                    description: entry.Description,
                    assessableValue: entry.Base?.toString() || '0',
                    sd: entry.SD?.toString() || '0',
                    qty: entry.PairsFinal?.toString() || '0',
                    unit: 'Pair',
                    notes: `Category: ${entry.Category}, Month: ${entry.Month}`
                });

                // Create BoE lot for FIFO tracking
                await db.insert(boeLots).values({
                    lotId: lotId,
                    boeNumber: entry.BoENumber,
                    boeItemNo: entry.BoEItemNo,
                    boeDate: boeDate.toISOString().split('T')[0],
                    productId: productId,
                    description: entry.Description,
                    hsCode: entry.HS || '',
                    baseValue: entry.Base?.toString() || '0',
                    sdValue: entry.SD?.toString() || '0',
                    unitPurchaseCost: entry.UnitPurchase?.toString() || '0',
                    category: entry.Category,
                    month: entry.Month || boeDate.toISOString().substring(0, 7),
                    cartonSize: entry.CartonSize || 0,
                    openingPairs: entry.PairsFinal,
                    closingPairs: entry.PairsFinal, // Initially same as opening
                    declaredUnitValue: entry.DeclaredUnitValue?.toString() || '0'
                });

                // Create stock ledger entry for Products page compatibility
                await db.execute(sql`
                    INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
                    VALUES (${boeDate}, ${productId}, 'IMPORT', ${lotId}, ${entry.PairsFinal}, 0, ${entry.UnitPurchase || 0})
                `);

                imported++;
                console.log(`✅ Successfully imported lot ${lotId}`);

            } catch (error) {
                console.error(`❌ Error processing row ${rowNum}:`, error);
                errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Processing error'}`);
            }
        }

        // Log the import action
        await db.insert(auditLog).values({
            action: 'seed_import',
            entityType: 'boe_lots',
            notes: `Seeded ${imported} BoE entries, created ${createdProducts.length} products, skipped ${skippedDuplicates} duplicates`,
            userId: 'system'
        });

        // Print summary
        console.log('\n📊 IMPORT SUMMARY');
        console.log('================');
        console.log(`✅ Successfully imported: ${imported} entries`);
        console.log(`➕ Created products: ${createdProducts.length}`);
        console.log(`⚠️  Skipped duplicates: ${skippedDuplicates}`);
        console.log(`❌ Errors: ${errors.length}`);

        if (createdProducts.length > 0) {
            console.log('\n📦 CREATED PRODUCTS:');
            createdProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product}`);
            });
        }

        if (errors.length > 0) {
            console.log('\n❌ ERRORS:');
            errors.slice(0, 10).forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
            if (errors.length > 10) {
                console.log(`... and ${errors.length - 10} more errors`);
            }
        }

        console.log('\n🎉 BoE data seeding completed successfully!');

        // Get final statistics
        const stats = await db.execute(sql`
            SELECT 
                COUNT(*) as total_lots,
                SUM(opening_pairs) as total_pairs,
                COUNT(DISTINCT product_id) as unique_products,
                COUNT(DISTINCT category) as unique_categories
            FROM boe_lots
        `);

        const finalStats = stats.rows[0] as any;
        console.log('\n📈 FINAL DATABASE STATISTICS:');
        console.log(`Total BoE lots: ${finalStats.total_lots}`);
        console.log(`Total pairs: ${finalStats.total_pairs}`);
        console.log(`Unique products: ${finalStats.unique_products}`);
        console.log(`Unique categories: ${finalStats.unique_categories}`);

    } catch (error) {
        console.error('💥 Fatal error during seeding:', error);
        process.exit(1);
    }
}

// Run the seeding function
if (require.main === module) {
    seedBoEData()
        .then(() => {
            console.log('✅ Seeding process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding process failed:', error);
            process.exit(1);
        });
}

export { seedBoEData };