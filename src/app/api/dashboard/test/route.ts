import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Test basic database connection
        await db.execute(sql`SELECT 1`);

        // Test closing balance table
        const closingBalance = await db.execute(sql`
            SELECT COUNT(*) as count FROM closing_balance
        `);

        return NextResponse.json({
            success: true,
            message: 'Dashboard test successful',
            closingBalanceCount: closingBalance.rows[0]
        });
    } catch (error) {
        console.error('Dashboard test failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Dashboard test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}