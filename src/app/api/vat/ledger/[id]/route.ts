import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { vatLedger, closingBalance } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const { usedFromClosingBalance, treasuryNeeded } = await request.json();

        const updatedEntry = await db
            .update(vatLedger)
            .set({
                usedFromClosingBalance: usedFromClosingBalance.toString(),
                treasuryNeeded: treasuryNeeded.toString(),
            })
            .where(eq(vatLedger.id, id))
            .returning();

        if (updatedEntry.length === 0) {
            return NextResponse.json(
                { error: 'VAT ledger entry not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedEntry[0]);
    } catch (error) {
        console.error('Error updating VAT ledger entry:', error);
        return NextResponse.json(
            { error: 'Failed to update VAT ledger entry' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);

        // First, get the VAT ledger entry to check how much was used from closing balance
        const [entry] = await db
            .select()
            .from(vatLedger)
            .where(eq(vatLedger.id, id));

        if (!entry) {
            return NextResponse.json(
                { error: 'VAT ledger entry not found' },
                { status: 404 }
            );
        }

        const usedFromClosingBalance = parseFloat(entry.usedFromClosingBalance || '0');

        // Delete the VAT ledger entry
        await db.delete(vatLedger).where(eq(vatLedger.id, id));

        // If any amount was used from closing balance, add it back
        if (usedFromClosingBalance > 0) {
            // Get current closing balance
            const [currentBalance] = await db
                .select()
                .from(closingBalance)
                .orderBy(closingBalance.id)
                .limit(1);

            if (currentBalance) {
                const currentAmount = parseFloat(currentBalance.closingBalance);
                const newAmount = currentAmount + usedFromClosingBalance;

                await db
                    .update(closingBalance)
                    .set({ closingBalance: newAmount.toString() })
                    .where(eq(closingBalance.id, currentBalance.id));
            }
        }

        return NextResponse.json({
            success: true,
            message: 'VAT ledger entry deleted successfully',
            restoredClosingBalance: usedFromClosingBalance
        });
    } catch (error) {
        console.error('Error deleting VAT ledger entry:', error);
        return NextResponse.json(
            { error: 'Failed to delete VAT ledger entry' },
            { status: 500 }
        );
    }
}