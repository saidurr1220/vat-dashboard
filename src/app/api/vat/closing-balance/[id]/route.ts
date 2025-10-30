import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { closingBalance } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const { closingBalance: closingBalanceAmount } = await request.json();

        const updatedBalance = await db
            .update(closingBalance)
            .set({
                closingBalance: closingBalanceAmount.toString(),
            })
            .where(eq(closingBalance.id, id))
            .returning();

        if (updatedBalance.length === 0) {
            return NextResponse.json(
                { error: 'Closing balance not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedBalance[0]);
    } catch (error) {
        console.error('Error updating closing balance:', error);
        return NextResponse.json(
            { error: 'Failed to update closing balance' },
            { status: 500 }
        );
    }
}