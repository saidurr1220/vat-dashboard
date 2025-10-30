import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { stockLedger, products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { productId, adjustmentType, quantity, reason } = await request.json();

        // Validate input
        if (!productId || !adjustmentType || !quantity || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (quantity <= 0) {
            return NextResponse.json(
                { error: 'Quantity must be greater than 0' },
                { status: 400 }
            );
        }

        if (!['IN', 'OUT'].includes(adjustmentType)) {
            return NextResponse.json(
                { error: 'Invalid adjustment type' },
                { status: 400 }
            );
        }

        // Check if product exists
        const product = await db
            .select({ id: products.id, name: products.name })
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        if (product.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // For stock out adjustments, check if there's enough stock
        if (adjustmentType === 'OUT') {
            const currentStock = await db.execute(sql`
        SELECT 
          COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) as current_stock
        FROM stock_ledger sl 
        WHERE sl.product_id = ${productId}
      `);

            const stockOnHand = Number(currentStock.rows[0]?.current_stock || 0);

            if (stockOnHand < quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock. Current stock: ${stockOnHand}` },
                    { status: 400 }
                );
            }
        }

        // Create stock adjustment entry
        const adjustmentEntry = {
            dt: new Date(),
            productId: productId,
            refType: 'ADJUST' as const,
            refNo: `ADJ-${Date.now()}`,
            qtyIn: adjustmentType === 'IN' ? quantity : 0,
            qtyOut: adjustmentType === 'OUT' ? quantity : 0,
            unitCostExVat: 0, // Adjustments don't have cost
        };

        // Insert the adjustment using raw SQL to avoid Drizzle issues
        await db.execute(sql`
      INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
      VALUES (${adjustmentEntry.dt}, ${adjustmentEntry.productId}, ${adjustmentEntry.refType}, 
              ${adjustmentEntry.refNo}, ${adjustmentEntry.qtyIn}, ${adjustmentEntry.qtyOut}, ${adjustmentEntry.unitCostExVat})
    `);

        // Get updated stock level
        const updatedStock = await db.execute(sql`
      SELECT 
        COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) as new_stock
      FROM stock_ledger sl 
      WHERE sl.product_id = ${productId}
    `);

        const newStockLevel = Number(updatedStock.rows[0]?.new_stock || 0);

        return NextResponse.json({
            success: true,
            message: `Stock ${adjustmentType === 'IN' ? 'increased' : 'decreased'} by ${quantity}`,
            productName: product[0].name,
            adjustment: {
                type: adjustmentType,
                quantity,
                reason
            },
            newStockLevel
        });

    } catch (error) {
        console.error('Error adjusting stock:', error);
        return NextResponse.json(
            { error: 'Failed to adjust stock' },
            { status: 500 }
        );
    }
}