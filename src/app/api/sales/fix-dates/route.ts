import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    return NextResponse.json({
        message: 'Use POST method to fix dates. Visit /fix-dates page instead.'
    });
}

export async function POST() {
    try {
        // First, let's see what sales we have
        const salesCheck = await db.execute(sql`
            SELECT id, dt, created_at FROM sales LIMIT 5
        `);

        console.log('Sample sales data:', salesCheck.rows);

        // Simple update - set all null dt values to current timestamp
        const result = await db.execute(sql`
            UPDATE sales 
            SET dt = NOW()
            WHERE dt IS NULL
        `);

        return NextResponse.json({
            success: true,
            message: `Updated ${result.rowCount || 0} sales with proper dates`,
            sampleData: salesCheck.rows
        });
    } catch (error) {
        console.error('Error fixing dates:', error);
        return NextResponse.json(
            {
                error: 'Failed to fix dates',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}