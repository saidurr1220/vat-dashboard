import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import {
    sales,
    vatLedger,
    closingBalance,
    treasuryChallans,
} from '@/db/schema';
import { sql, eq, and } from 'drizzle-orm';

export async function GET() {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

        // Get current month sales summary
        const salesSummary = await db
            .select({
                totalGross: sql<number>`COALESCE(SUM(${sales.totalValue}), 0)`,
                totalVAT: sql<number>`COALESCE(SUM(CASE WHEN ${sales.amountType} = 'INCL' THEN ${sales.totalValue} * 0.15 / 1.15 ELSE ${sales.totalValue} * 0.15 END), 0)`,
                totalNet: sql<number>`COALESCE(SUM(CASE WHEN ${sales.amountType} = 'INCL' THEN ${sales.totalValue} - (${sales.totalValue} * 0.15 / 1.15) ELSE ${sales.totalValue} END), 0)`,
                count: sql<number>`COUNT(*)`,
            })
            .from(sales)
            .where(
                and(
                    sql`EXTRACT(YEAR FROM ${sales.dt}) = ${currentYear}`,
                    sql`EXTRACT(MONTH FROM ${sales.dt}) = ${currentMonth}`
                )
            );

        // Also get all-time sales for comparison
        const allTimeSales = await db
            .select({
                totalGross: sql<number>`COALESCE(SUM(${sales.totalValue}), 0)`,
                totalVAT: sql<number>`COALESCE(SUM(CASE WHEN ${sales.amountType} = 'INCL' THEN ${sales.totalValue} * 0.15 / 1.15 ELSE ${sales.totalValue} * 0.15 END), 0)`,
                totalNet: sql<number>`COALESCE(SUM(CASE WHEN ${sales.amountType} = 'INCL' THEN ${sales.totalValue} - (${sales.totalValue} * 0.15 / 1.15) ELSE ${sales.totalValue} END), 0)`,
                count: sql<number>`COUNT(*)`,
            })
            .from(sales);

        // Get VAT ledger for current period
        const vatLedgerEntry = await db
            .select()
            .from(vatLedger)
            .where(
                and(
                    eq(vatLedger.periodYear, currentYear),
                    eq(vatLedger.periodMonth, currentMonth)
                )
            )
            .limit(1);

        // Get current closing balance with fallback
        let currentClosingBalance = 0;
        try {
            // Try old format first (most likely to exist)
            const currentClosingBalanceResult = await db.execute(sql`
                SELECT amount_bdt as balance
                FROM closing_balance 
                WHERE period_year = ${currentYear} AND period_month = ${currentMonth}
                LIMIT 1
            `);

            if (currentClosingBalanceResult.rows.length > 0) {
                currentClosingBalance = parseFloat((currentClosingBalanceResult.rows[0] as any).balance || '0');
            }
        } catch (error) {
            console.log('Closing balance table might not exist:', error);
            currentClosingBalance = 0;
        }

        // Get treasury challans for current month
        const treasuryChallanSum = await db
            .select({
                total: sql<number>`COALESCE(SUM(${treasuryChallans.amountBdt}), 0)`,
            })
            .from(treasuryChallans)
            .where(
                and(
                    eq(treasuryChallans.periodYear, currentYear),
                    eq(treasuryChallans.periodMonth, currentMonth)
                )
            );

        const response = NextResponse.json({
            salesSummary: salesSummary[0],
            allTimeSales: allTimeSales[0],
            vatLedgerEntry: vatLedgerEntry[0] || null,
            closingBalance: currentClosingBalance,
            treasuryChallanSum: treasuryChallanSum[0].total,
            currentPeriod: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
            timestamp: new Date().toISOString(),
        });

        // Add caching headers for better performance
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

        return response;

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard summary' },
            { status: 500 }
        );
    }
}