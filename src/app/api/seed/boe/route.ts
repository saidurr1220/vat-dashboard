import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products, importsBoe, stockLedger } from '@/db/schema';
import { boeLots, productAliases, auditLog } from '@/db/footwear-schema';
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

export async function POST() {
    try {
        console.log('🚀 Starting BoE data seeding via API...');

        // Read the JSON file from the public directory or project root
        let jsonPath = path.join(process.cwd(), 'public', 'footwear_boe_import.json');

        if (!fs.existsSync(jsonPath)) {
            jsonPath = path.join(process.cwd(), 'footwear_boe_import.json');
        }

        if (!fs.existsSync(jsonPath)) {
            return NextResponse.json(
                { error: 'BoE data file not found. Please ensure footwear_boe_import.json exists in the project root or public directory.' },
                { status: 404 }
            );
        }

        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        const importData: BoEImportData[] = JSON.parse(fileContent);

        let imported = 0;
        let errors: string[] = [];
        let createdProducts: string[] = [];
        let skippedDuplicates = 0;

        // Process entries
        for (let i = 0; i < importData.length; i++) {
            const entry = importData[i];
            const rowNum = i + 1;

            try {
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

                    // Create product alias
                    await db.insert(productAliases).values({
                        aliasText: entry.Description.toLowerCase(),
                        productId: productId
                    });
                } else {
                    productId = product[0].id;
                }

                // Insert BoE import record
                await db.insert(importsBoe).values({
                    boeNo: entry.BoENumber.toString(),
                    boeDate: boeDate,
                    itemNo: entry.BoEItemNo.toString(),
                    hsCode: entry.HS || '',
                    description: `${entry.Description} (${entry.Category})`,
                    assessableValue: entry.Base?.toString() || '0',
                    sd: entry.SD?.toString() || '0',
                    qty: entry.PairsFinal?.toString() || '0',
                    unit: 'Pair'
                });

                // Create BoE lot
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
                    closingPairs: entry.PairsFinal,
                    declaredUnitValue: entry.DeclaredUnitValue?.toString() || '0'
                });

                // Create stock ledger entry
                await db.execute(sql`
                    INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
                    VALUES (${boeDate}, ${productId}, 'IMPORT', ${lotId}, ${entry.PairsFinal}, 0, ${entry.UnitPurchase || 0})
                `);

                imported++;

            } catch (error) {
                console.error(`Error processing row ${rowNum}:`, error);
                errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Processing error'}`);
            }
        }

        // Log the import action
        await db.insert(auditLog).values({
            action: 'api_seed_import',
            entityType: 'boe_lots',
            notes: `API seeded ${imported} BoE entries, created ${createdProducts.length} products, skipped ${skippedDuplicates} duplicates`,
            userId: 'api_user'
        });

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

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${imported} BoE entries`,
            imported,
            createdProducts: createdProducts.length,
            skippedDuplicates,
            errors: errors.slice(0, 5), // Limit errors in response
            statistics: {
                totalLots: parseInt(finalStats.total_lots || '0'),
                totalPairs: parseInt(finalStats.total_pairs || '0'),
                uniqueProducts: parseInt(finalStats.unique_products || '0'),
                uniqueCategories: parseInt(finalStats.unique_categories || '0')
            }
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to seed BoE data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}