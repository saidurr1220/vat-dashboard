import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { vatLedger, closingBalance } from '@/db/schema';
import { sql, eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            year,
            month,
            grossSales,
            netSalesExVat,
            vatPayable,
            usedFromClosingBalance,
            treasuryNeeded
        } = body;

        if (!year || !month || vatPayable === undefined) {
            return NextResponse.json(
                { error: 'Year, month, and VAT payable are required' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            // Check if VAT computation already exists
            const existing = await tx
                .select()
                .from(vatLedger)
                .where(
                    and(
                        eq(vatLedger.periodYear, year),
                        eq(vatLedger.periodMonth, month)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                // Update existing computation
                await tx
                    .update(vatLedger)
                    .set({
                        grossSales: grossSales.toString(),
                        netSalesExVat: netSalesExVat.toString(),
                        vatPayable: vatPayable.toString(),
                        usedFromClosingBalance: usedFromClosingBalance.toString(),
                        treasuryNeeded: treasuryNeeded.toString(),
                        locked: true
                    })
                    .where(
                        and(
                            eq(vatLedger.periodYear, year),
                            eq(vatLedger.periodMonth, month)
                        )
                    );
            } else {
                // Create new VAT computation
                await tx.insert(vatLedger).values({
                    periodYear: year,
                    periodMonth: month,
                    grossSales: grossSales.toString(),
                    netSalesExVat: netSalesExVat.toString(),
                    vatRate: "0.15",
                    vatPayable: vatPayable.toString(),
                    usedFromClosingBalance: usedFromClosingBalance.toString(),
                    treasuryNeeded: treasuryNeeded.toString(),
                    locked: true
                });
            }

            // Update closing balance if used
            if (usedFromClosingBalance > 0) {
                const currentBalance = await tx
                    .select()
                    .from(closingBalance)
                    .where(
                        and(
                            eq(closingBalance.periodYear, year),
                            eq(closingBalance.periodMonth, month)
                        )
                    )
                    .limit(1);

                if (currentBalance.length > 0) {
                    const newAmount = parseFloat(currentBalance[0].closingBalance) - usedFromClosingBalance;
                    await tx
                        .update(closingBalance)
                        .set({
                            closingBalance: Math.max(0, newAmount).toString()
                        })
                        .where(
                            and(
                                eq(closingBalance.periodYear, year),
                                eq(closingBalance.periodMonth, month)
                            )
                        );
                } else {
                    // Create closing balance entry if it doesn't exist
                    await tx.insert(closingBalance).values({
                        periodYear: year,
                        periodMonth: month,
                        closingBalance: "0"
                    });
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'VAT computation saved successfully'
        });

    } catch (error) {
        console.error('Error computing VAT:', error);
        return NextResponse.json(
            { error: 'Failed to compute VAT' },
            { status: 500 }
        );
    }
}