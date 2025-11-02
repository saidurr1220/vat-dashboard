import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { vatLedger } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET() {
    try {
        const entries = await db
            .select()
            .from(vatLedger)
            .orderBy(desc(vatLedger.periodYear), desc(vatLedger.periodMonth));

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Error fetching VAT ledger:', error);
        return NextResponse.json(
            { error: 'Failed to fetch VAT ledger' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { periodYear, periodMonth, locked } = await request.json();

        if (!periodYear || !periodMonth) {
            return NextResponse.json(
                { error: 'Period year and month are required' },
                { status: 400 }
            );
        }

        const updatedEntry = await db
            .update(vatLedger)
            .set({
                locked: locked
            })
            .where(
                and(
                    eq(vatLedger.periodYear, periodYear),
                    eq(vatLedger.periodMonth, periodMonth)
                )
            )
            .returning();

        if (updatedEntry.length === 0) {
            return NextResponse.json(
                { error: 'VAT ledger entry not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            entry: updatedEntry[0]
        });
    } catch (error) {
        console.error('Error updating VAT ledger:', error);
        return NextResponse.json(
            { error: 'Failed to update VAT ledger' },
            { status: 500 }
        );
    }
}