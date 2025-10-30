import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { closingBalance } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fromYear, fromMonth, toYear, toMonth } = body;

        if (!fromYear || !fromMonth || !toYear || !toMonth) {
            return NextResponse.json(
                { error: 'From and to year/month are required' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            // Get the previous month's closing balance
            const previousBalance = await tx
                .select()
                .from(closingBalance)
                .where(
                    and(
                        eq(closingBalance.periodYear, fromYear),
                        eq(closingBalance.periodMonth, fromMonth)
                    )
                )
                .limit(1);

            if (previousBalance.length === 0) {
                throw new Error(`No closing balance found for ${fromYear}-${fromMonth}`);
            }

            const carryForwardAmount = parseFloat(previousBalance[0].closingBalance);

            // Check if target month already has a balance
            const existingBalance = await tx
                .select()
                .from(closingBalance)
                .where(
                    and(
                        eq(closingBalance.periodYear, toYear),
                        eq(closingBalance.periodMonth, toMonth)
                    )
                )
                .limit(1);

            if (existingBalance.length > 0) {
                // Update existing balance by adding carry forward amount
                const currentAmount = parseFloat(existingBalance[0].closingBalance);
                const newAmount = currentAmount + carryForwardAmount;

                await tx
                    .update(closingBalance)
                    .set({
                        closingBalance: newAmount.toString()
                    })
                    .where(
                        and(
                            eq(closingBalance.periodYear, toYear),
                            eq(closingBalance.periodMonth, toMonth)
                        )
                    );
            } else {
                // Create new balance with carry forward amount
                await tx.insert(closingBalance).values({
                    periodYear: toYear,
                    periodMonth: toMonth,
                    closingBalance: carryForwardAmount.toString()
                });
            }
        });

        return NextResponse.json({
            success: true,
            message: `Closing balance carried forward from ${fromYear}-${fromMonth} to ${toYear}-${toMonth}`
        });

    } catch (error) {
        console.error('Error carrying forward closing balance:', error);
        return NextResponse.json(
            { error: 'Failed to carry forward closing balance' },
            { status: 500 }
        );
    }
}

// Get carry forward history
export async function GET() {
    try {
        const result = await db.execute(sql`
            SELECT 
                period_year as "year",
                period_month as "month",
                amount_bdt as "amount",
                created_at as "createdAt"
            FROM closing_balance 
            ORDER BY period_year DESC, period_month DESC
        `);

        const balances = result.rows.map((row: any) => ({
            year: row.year,
            month: row.month,
            amount: parseFloat(row.amount || '0'),
            createdAt: row.createdAt
        }));

        return NextResponse.json(balances);
    } catch (error) {
        console.error('Error fetching closing balance history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch closing balance history' },
            { status: 500 }
        );
    }
}