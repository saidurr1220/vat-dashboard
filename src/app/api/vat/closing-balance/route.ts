import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { closingBalance } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // First check if the table exists
        let tableExists = false;
        try {
            await db.execute(sql`SELECT 1 FROM closing_balance LIMIT 1`);
            tableExists = true;
        } catch (error) {
            console.error('Database connection or table issue:', error);
            return NextResponse.json({
                needsMigration: true,
                message: 'Closing balance table needs to be created. Please run the migration.',
                error: 'Database connection failed or table does not exist'
            }, { status: 200 });
        }

        if (!tableExists) {
            // Return migration needed response instead of trying to create table here
            return NextResponse.json({
                needsMigration: true,
                message: 'Closing balance table needs to be created. Please run the migration.'
            }, { status: 200 });
        }

        // Try to check if new structure exists
        let hasNewStructure = false;
        try {
            await db.execute(sql`SELECT opening_balance FROM closing_balance LIMIT 1`);
            hasNewStructure = true;
        } catch (error) {
            // Column doesn't exist, need migration
            hasNewStructure = false;
        }

        if (!hasNewStructure) {
            return NextResponse.json({
                needsMigration: true,
                message: 'Table structure needs to be updated for bank statement format'
            }, { status: 200 });
        }

        // Query with new structure
        const result = await db.execute(sql`
            SELECT 
                period_year as "year",
                period_month as "month",
                COALESCE(opening_balance, 0) as "openingBalance",
                COALESCE(current_month_addition, 0) as "currentMonthAddition",
                COALESCE(used_amount, 0) as "usedAmount",
                COALESCE(closing_balance, 0) as "closingBalance",
                notes,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM closing_balance 
            ORDER BY period_year DESC, period_month DESC
        `);

        const balances = result.rows.map((row: any) => ({
            year: row.year,
            month: row.month,
            openingBalance: parseFloat(row.openingBalance || '0'),
            currentMonthAddition: parseFloat(row.currentMonthAddition || '0'),
            usedAmount: parseFloat(row.usedAmount || '0'),
            closingBalance: parseFloat(row.closingBalance || '0'),
            notes: row.notes,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        }));

        return NextResponse.json(balances);
    } catch (error) {
        console.error('Error fetching closing balances:', error);

        // More detailed error logging
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch closing balances',
                details: `Failed query: \n            SELECT \n                period_year as "year",\n                period_month as "month",\n                COALESCE(opening_balance, 0) as "openingBalance",\n                COALESCE(current_month_addition, 0) as "currentMonthAddition",\n                COALESCE(used_amount, 0) as "usedAmount",\n                COALESCE(closing_balance, 0) as "closingBalance",\n                notes,\n                created_at as "createdAt",\n                updated_at as "updatedAt"\n            FROM closing_balance \n            ORDER BY period_year DESC, period_month DESC\n        \nparams: ${error instanceof Error ? error.message : 'Unknown error'}`
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { year, month, currentMonthAddition, usedAmount, notes } = body;

        if (!year || !month) {
            return NextResponse.json(
                { error: 'Year and month are required' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            // Get previous month's closing balance
            let openingBalance = 0;
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;

            const previousBalance = await tx.execute(sql`
                SELECT closing_balance 
                FROM closing_balance 
                WHERE period_year = ${prevYear} AND period_month = ${prevMonth}
                LIMIT 1
            `);

            if (previousBalance.rows.length > 0) {
                openingBalance = parseFloat((previousBalance.rows[0] as any).closing_balance || '0');
            }

            // Calculate new closing balance
            const addition = parseFloat(currentMonthAddition || '0');
            const used = parseFloat(usedAmount || '0');
            const newClosingBalance = openingBalance + addition - used;

            // Check if balance already exists
            const existing = await tx.execute(sql`
                SELECT id FROM closing_balance 
                WHERE period_year = ${year} AND period_month = ${month}
                LIMIT 1
            `);

            if (existing.rows.length > 0) {
                // Update existing balance
                await tx.execute(sql`
                    UPDATE closing_balance 
                    SET 
                        opening_balance = ${openingBalance},
                        current_month_addition = ${addition},
                        used_amount = ${used},
                        closing_balance = ${newClosingBalance},
                        notes = ${notes || ''},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE period_year = ${year} AND period_month = ${month}
                `);
            } else {
                // Create new balance
                await tx.execute(sql`
                    INSERT INTO closing_balance (
                        period_year, period_month, opening_balance, 
                        current_month_addition, used_amount, closing_balance, notes
                    ) VALUES (
                        ${year}, ${month}, ${openingBalance}, 
                        ${addition}, ${used}, ${newClosingBalance}, ${notes || ''}
                    )
                `);
            }

            // Update next month's opening balance if it exists
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;

            await tx.execute(sql`
                UPDATE closing_balance 
                SET 
                    opening_balance = ${newClosingBalance},
                    closing_balance = opening_balance + current_month_addition - used_amount,
                    updated_at = CURRENT_TIMESTAMP
                WHERE period_year = ${nextYear} AND period_month = ${nextMonth}
            `);
        });

        return NextResponse.json({
            success: true,
            message: 'Closing balance updated successfully'
        });

    } catch (error) {
        console.error('Error saving closing balance:', error);
        return NextResponse.json(
            { error: 'Failed to save closing balance' },
            { status: 500 }
        );
    }
}