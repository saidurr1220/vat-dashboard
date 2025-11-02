import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products, importsBoe, stockLedger } from '@/db/schema';
import { boeLots, productAliases, auditLog } from '@/db/footwear-schema';
import { sql, eq } from 'drizzle-orm';

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

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Read and parse JSON file
        const fileContent = await file.text();
        let importData: BoEImportData[];

        try {
            importData = JSON.parse(fileContent);
        } catch (parseError) {
            return NextResponse.json(
                { error: 'Invalid JSON format' },
                { status: 400 }
            );
        }

        if (!Array.isArray(importData)) {
            return NextResponse.json(
                { error: 'JSON must be an array of BoE entries' },
                { status: 400 }
            );
        }

        let imported = 0;
        let errors: string[] = [];
        let createdProducts: string[] = [];

        // Process entries one by one to avoid transaction conflicts
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
                    errors.push(`Row ${rowNum}: Duplicate lot ${lotId}`);
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

                    // Create product alias for description normalization
                    await db.insert(productAliases).values({
                        aliasText: entry.Description.toLowerCase(),
                        productId: productId
                    });
                } else {
                    productId = product[0].id;
                }

                // Insert BoE import record for BoE page
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

                // Also create stock ledger entry for Products page compatibility
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
            action: 'import',
            entityType: 'boe_lots',
            notes: `Imported ${imported} BoE entries, created ${createdProducts.length} products`,
            userId: 'admin'
        });

        const response = {
            success: imported > 0,
            message: imported > 0
                ? `Successfully imported ${imported} BoE entries${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
                : 'No entries were imported',
            imported,
            createdProducts: createdProducts.length,
            errors: errors.slice(0, 10), // Limit errors to first 10
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json(
            { error: 'Failed to process import' },
            { status: 500 }
        );
    }
}