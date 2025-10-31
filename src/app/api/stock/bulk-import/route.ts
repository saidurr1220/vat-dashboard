import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products, stockLedger } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const stockData = [
            {
                sku: "OT001",
                name: "Fan Parts Set (Motor+Body + Blade+Grill) 16\"",
                category: "Appliance Parts",
                unit: "PC",
                hsCode: "8414.90.10",
                costExVat: 1392.25,
                sellExVat: 1899.00,
                currentStock: 2002.00
            },
            {
                sku: "FT001",
                name: "BABY FOOTWEAR",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 166.69,
                sellExVat: 211.71,
                currentStock: 154861.00
            },
            {
                sku: "FT002",
                name: "BOYS & GIRLS SANDAL",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 204.85,
                sellExVat: 286.79,
                currentStock: 12938.00
            },
            {
                sku: "FT003",
                name: "BOYS (OTHERS)",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 204.85,
                sellExVat: 286.79,
                currentStock: 2668.00
            },
            {
                sku: "FT004",
                name: "BOYS KEDS",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 204.85,
                sellExVat: 286.79,
                currentStock: 19090.00
            },
            {
                sku: "FT005",
                name: "BOYS SANDAL",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 220.16,
                sellExVat: 303.49,
                currentStock: 4424.00
            },
            {
                sku: "FT006",
                name: "GIRLS SANDAL",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 204.85,
                sellExVat: 286.79,
                currentStock: 5980.00
            },
            {
                sku: "FT007",
                name: "LADIES KEDS",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 297.94,
                sellExVat: 417.12,
                currentStock: 56062.00
            },
            {
                sku: "FT008",
                name: "Ladies Sandal",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 307.46,
                sellExVat: 427.50,
                currentStock: 6630.00
            },
            {
                sku: "FT009",
                name: "MENS KEDS",
                category: "Footwear",
                unit: "PAIR",
                hsCode: "6405.90.00",
                costExVat: 559.72,
                sellExVat: 783.28,
                currentStock: 40844.00
            },
            {
                sku: "OT008",
                name: "Absorbance 96 microplate reader",
                category: "Instrument",
                unit: "PC",
                hsCode: "9027.50.00",
                costExVat: 464513.82,
                sellExVat: 636383.93,
                currentStock: 1.00
            },
            {
                sku: "OT002",
                name: "Bio-Shield DON M.E 96",
                category: "Reagent",
                unit: "PC (TEST)",
                hsCode: "3822.00.00",
                costExVat: 199.71,
                sellExVat: 273.60,
                currentStock: 1340.00
            },
            {
                sku: "OT007",
                name: "Bio-Shield Fumonisin-5",
                category: "Reagent",
                unit: "PC (TEST)",
                hsCode: "3822.00.00",
                costExVat: 199.72,
                sellExVat: 273.62,
                currentStock: 120.00
            },
            {
                sku: "OT003",
                name: "Bio-Shield Ochratoxin-8 (896)",
                category: "Reagent",
                unit: "PC (TEST)",
                hsCode: "3822.00.00",
                costExVat: 199.72,
                sellExVat: 273.62,
                currentStock: 860.00
            },
            {
                sku: "OT005",
                name: "Bio-Shield T-2",
                category: "Reagent",
                unit: "PC (TEST)",
                hsCode: "3822.00.00",
                costExVat: 199.72,
                sellExVat: 273.62,
                currentStock: 120.00
            },
            {
                sku: "OT004",
                name: "Bio-Shield Total-5 (596)",
                category: "Reagent",
                unit: "PC (TEST)",
                hsCode: "3822.00.00",
                costExVat: 199.72,
                sellExVat: 273.62,
                currentStock: 3120.00
            },
            {
                sku: "OT006",
                name: "Bio-Shield ZON-5",
                category: "Reagent",
                unit: "PC (TEST)",
                hsCode: "3822.00.00",
                costExVat: 199.71,
                sellExVat: 273.60,
                currentStock: 240.00
            }
        ];

        // Use raw SQL to avoid enum issues
        const result = [];

        for (const item of stockData) {
            try {
                // Check if product exists
                const existingProduct = await db.execute(sql`
                    SELECT id FROM products WHERE sku = ${item.sku} LIMIT 1
                `);

                let productId;

                if (existingProduct.rows.length > 0) {
                    // Update existing product
                    productId = (existingProduct.rows[0] as any).id;
                    await db.execute(sql`
                        UPDATE products 
                        SET name = ${item.name},
                            category = ${item.category},
                            unit = ${item.unit},
                            hs_code = ${item.hsCode},
                            cost_ex_vat = ${item.costExVat.toString()},
                            sell_ex_vat = ${item.sellExVat.toString()},
                            updated_at = NOW()
                        WHERE sku = ${item.sku}
                    `);
                } else {
                    // Insert new product
                    const newProduct = await db.execute(sql`
                        INSERT INTO products (sku, name, category, unit, hs_code, cost_ex_vat, sell_ex_vat)
                        VALUES (${item.sku}, ${item.name}, ${item.category}, ${item.unit}, ${item.hsCode}, ${item.costExVat.toString()}, ${item.sellExVat.toString()})
                        RETURNING id
                    `);
                    productId = (newProduct.rows[0] as any).id;
                }

                // Note: Stock ledger entry skipped for now due to table structure issues
                // TODO: Add stock ledger entry once table structure is confirmed

                result.push({
                    sku: item.sku,
                    name: item.name,
                    productId,
                    stock: item.currentStock,
                    status: 'success'
                });

            } catch (itemError) {
                console.error(`Error processing item ${item.sku}:`, itemError);
                result.push({
                    sku: item.sku,
                    name: item.name,
                    status: 'error',
                    error: itemError instanceof Error ? itemError.message : 'Unknown error'
                });
            }
        }

        const successCount = result.filter(r => r.status === 'success').length;
        const errorCount = result.filter(r => r.status === 'error').length;

        return NextResponse.json({
            success: true,
            message: `Processed ${result.length} products. Success: ${successCount}, Errors: ${errorCount}`,
            results: result
        });

    } catch (error) {
        console.error('Error importing stock data:', error);
        return NextResponse.json(
            {
                error: 'Failed to import stock data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}