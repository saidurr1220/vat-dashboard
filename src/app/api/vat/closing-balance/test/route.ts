import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Simple database connectivity test
        const result = await db.execute(sql`SELECT 1 as test`);

        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            testResult: result.rows[0]
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        return NextResponse.json(
            {
                error: 'Database connection failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}