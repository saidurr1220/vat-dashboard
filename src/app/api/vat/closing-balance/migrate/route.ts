import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST() {
    try {
        // Check if new structure already exists by checking for all required columns
        let hasNewStructure = false;
        try {
            await db.execute(sql`
                SELECT opening_balance, current_month_addition, used_amount, closing_balance 
                FROM closing_balance LIMIT 1
            `);
            hasNewStructure = true;
        } catch (error) {
            hasNewStructure = false;
        }

        if (hasNewStructure) {
            return NextResponse.json({
                success: true,
                message: 'Table already has the new structure'
            });
        }

        // Check if table exists at all
        let tableExists = false;
        try {
            await db.execute(sql`SELECT 1 FROM closing_balance LIMIT 1`);
            tableExists = true;
        } catch (error) {
            tableExists = false;
        }

        if (!tableExists) {
            // Create new table with proper structure
            await db.execute(sql`
                CREATE TABLE closing_balance (
                    id SERIAL PRIMARY KEY,
                    period_year INTEGER NOT NULL,
                    period_month INTEGER NOT NULL,
                    opening_balance DECIMAL(15,2) DEFAULT 0,
                    current_month_addition DECIMAL(15,2) DEFAULT 0,
                    used_amount DECIMAL(15,2) DEFAULT 0,
                    closing_balance DECIMAL(15,2) DEFAULT 0,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(period_year, period_month)
                )
            `);

            return NextResponse.json({
                success: true,
                message: 'Closing balance table created successfully with new structure'
            });
        }

        // Table exists but needs migration - add new columns
        const alterCommands = [
            'ALTER TABLE closing_balance ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15,2) DEFAULT 0',
            'ALTER TABLE closing_balance ADD COLUMN IF NOT EXISTS current_month_addition DECIMAL(15,2) DEFAULT 0',
            'ALTER TABLE closing_balance ADD COLUMN IF NOT EXISTS used_amount DECIMAL(15,2) DEFAULT 0',
            'ALTER TABLE closing_balance ADD COLUMN IF NOT EXISTS closing_balance DECIMAL(15,2) DEFAULT 0',
            'ALTER TABLE closing_balance ADD COLUMN IF NOT EXISTS notes TEXT',
            'ALTER TABLE closing_balance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];

        for (const command of alterCommands) {
            try {
                await db.execute(sql.raw(command));
            } catch (error) {
                console.log(`Column might already exist: ${command}`);
            }
        }

        // If old column exists, migrate data
        try {
            await db.execute(sql`
                UPDATE closing_balance 
                SET closing_balance = amount_bdt
                WHERE closing_balance IS NULL OR closing_balance = 0
            `);

            // Drop old column if it exists
            await db.execute(sql`ALTER TABLE closing_balance DROP COLUMN IF EXISTS amount_bdt`);
        } catch (error) {
            console.log('Old column migration not needed or already done');
        }

        return NextResponse.json({
            success: true,
            message: 'Closing balance table migrated successfully to new bank statement format'
        });

    } catch (error) {
        console.error('Error migrating closing balance table:', error);
        return NextResponse.json(
            {
                error: 'Failed to migrate closing balance table',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}