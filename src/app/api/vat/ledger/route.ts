import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { vatLedger } from '@/db/schema';
import { desc } from 'drizzle-orm';

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