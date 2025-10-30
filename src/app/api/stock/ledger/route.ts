import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { stockLedger } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            productId,
            transactionType,
            referenceType,
            referenceId,
            qtyIn,
            qtyOut,
            costPerUnit,
            totalCost,
            notes
        } = body;

        // Validate required fields
        if (!productId || !transactionType || !referenceType || !referenceId) {
            return NextResponse.json(
                { error: 'Missing required fields: productId, transactionType, referenceType, referenceId' },
                { status: 400 }
            );
        }

        // Create the stock ledger entry using raw SQL to avoid type issues
        const result = await db.execute(sql`
            INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
            VALUES (${new Date()}, ${parseInt(productId)}, ${referenceType}, ${referenceId}, 
                    ${parseInt(qtyIn) || 0}, ${parseInt(qtyOut) || 0}, ${parseFloat(costPerUnit) || 0})
            RETURNING *
        `);

        return NextResponse.json({
            success: true,
            message: 'Stock ledger entry created successfully',
            entry: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating stock ledger entry:', error);
        return NextResponse.json(
            { error: 'Failed to create stock ledger entry' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        let entries;

        if (productId) {
            entries = await db
                .select()
                .from(stockLedger)
                .where(eq(stockLedger.productId, parseInt(productId)))
                .orderBy(stockLedger.dt);
        } else {
            entries = await db
                .select()
                .from(stockLedger)
                .orderBy(stockLedger.dt);
        }

        return NextResponse.json({
            success: true,
            data: entries
        });

    } catch (error) {
        console.error('Error fetching stock ledger:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock ledger' },
            { status: 500 }
        );
    }
}