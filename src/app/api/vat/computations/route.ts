import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { vatLedger } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const result = await db
            .select({
                year: vatLedger.periodYear,
                month: vatLedger.periodMonth,
                grossSales: vatLedger.grossSales,
                netSalesExVat: vatLedger.netSalesExVat,
                vatPayable: vatLedger.vatPayable,
                usedFromClosingBalance: vatLedger.usedFromClosingBalance,
                treasuryNeeded: vatLedger.treasuryNeeded,
                locked: vatLedger.locked
            })
            .from(vatLedger)
            .orderBy(vatLedger.periodYear, vatLedger.periodMonth);

        const computations = result.map(row => ({
            year: row.year,
            month: row.month,
            grossSales: parseFloat(row.grossSales || '0'),
            netSalesExVat: parseFloat(row.netSalesExVat || '0'),
            vatPayable: parseFloat(row.vatPayable || '0'),
            usedFromClosingBalance: parseFloat(row.usedFromClosingBalance || '0'),
            treasuryNeeded: parseFloat(row.treasuryNeeded || '0'),
            locked: row.locked
        }));

        return NextResponse.json(computations);
    } catch (error) {
        console.error('Error fetching VAT computations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch VAT computations' },
            { status: 500 }
        );
    }
}