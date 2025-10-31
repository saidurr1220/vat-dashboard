import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        // Add notes column to sales table if it doesn't exist
        await db.execute(sql`
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes TEXT
        `);

        return NextResponse.json({
            success: true,
            message: 'Successfully added notes column to sales table'
        });

    } catch (error) {
        console.error('Error adding notes column:', error);
        return NextResponse.json(
            {
                error: 'Failed to add notes column',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}