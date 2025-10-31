import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        // Add customer_id column to sales table if it doesn't exist
        await db.execute(sql`
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)
        `);

        return NextResponse.json({
            success: true,
            message: 'Successfully added customer_id column to sales table'
        });

    } catch (error) {
        console.error('Error adding customer_id column:', error);
        return NextResponse.json(
            {
                error: 'Failed to add customer_id column',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}