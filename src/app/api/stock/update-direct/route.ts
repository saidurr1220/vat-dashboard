import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        // Stock data with SKU and stock quantities
        const stockUpdates = [
            { sku: "OT001", stock: 2002 },
            { sku: "FT001", stock: 154861 },
            { sku: "FT002", stock: 12938 },
            { sku: "FT003", stock: 2668 },
            { sku: "FT004", stock: 19090 },
            { sku: "FT005", stock: 4424 },
            { sku: "FT006", stock: 5980 },
            { sku: "FT007", stock: 56062 },
            { sku: "FT008", stock: 6630 },
            { sku: "FT009", stock: 40844 },
            { sku: "OT008", stock: 1 },
            { sku: "OT002", stock: 1340 },
            { sku: "OT007", stock: 120 },
            { sku: "OT003", stock: 860 },
            { sku: "OT005", stock: 120 },
            { sku: "OT004", stock: 3120 },
            { sku: "OT006", stock: 240 }
        ];

        // First, add a stock_on_hand column to products table if it doesn't exist
        try {
            await db.execute(sql`
                ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_on_hand NUMERIC DEFAULT 0
            `);
        } catch (error) {
            console.log('Column might already exist:', error);
        }

        const results = [];

        for (const update of stockUpdates) {
            try {
                // Update stock directly in products table
                const result = await db.execute(sql`
                    UPDATE products 
                    SET stock_on_hand = ${update.stock.toString()}
                    WHERE sku = ${update.sku}
                    RETURNING id, name, sku, stock_on_hand
                `);

                if (result.rows.length > 0) {
                    results.push({
                        sku: update.sku,
                        stock: update.stock,
                        status: 'success',
                        product: result.rows[0]
                    });
                } else {
                    results.push({
                        sku: update.sku,
                        stock: update.stock,
                        status: 'not_found'
                    });
                }
            } catch (error) {
                results.push({
                    sku: update.sku,
                    stock: update.stock,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;

        return NextResponse.json({
            success: true,
            message: `Updated stock for ${successCount} products`,
            results
        });

    } catch (error) {
        console.error('Error updating stock:', error);
        return NextResponse.json(
            {
                error: 'Failed to update stock',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}