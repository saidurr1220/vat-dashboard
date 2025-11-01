import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { stockLedger, products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { productId, adjustmentType, quantity, reason, notes } = await request.json();

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
                SELECT COALESCE(stock_on_hand::numeric, 0) as current_stock
                FROM products 
                WHERE id = ${productId}
            `);

            const stockOnHand = Number(currentStock.rows[0]?.current_stock || 0);

            if (stockOnHand < quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock. Current stock: ${stockOnHand}` },
                    { status: 400 }
                );
            }
        }

        // Update stock_on_hand directly in products table
        const stockChange = adjustmentType === 'IN' ? quantity : -quantity;

        const updatedProduct = await db.execute(sql`
            UPDATE products 
            SET stock_on_hand = GREATEST(0, COALESCE(stock_on_hand::numeric, 0) + ${stockChange})
            WHERE id = ${productId}
            RETURNING stock_on_hand
        `);

        const newStockLevel = Number(updatedProduct.rows[0]?.stock_on_hand || 0);

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