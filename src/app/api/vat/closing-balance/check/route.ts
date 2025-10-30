import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Check if table exists and what columns it has
        const tableInfo = await db.execute(sql`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'closing_balance'
            ORDER BY ordinal_position
        `);

        const columns = tableInfo.rows.map((row: any) => ({
            name: row.column_name,
            type: row.data_type
        }));

        return NextResponse.json({
            exists: columns.length > 0,
            columns: columns,
            hasNewStructure: columns.some(col => col.name === 'opening_balance')
        });
    } catch (error) {
        console.error('Error checking table structure:', error);
        return NextResponse.json(
            {
                error: 'Failed to check table structure',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}