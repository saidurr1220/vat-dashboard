import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        // Check if sales_lines table exists and what columns it has
        const tableInfo = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sales_lines'
            ORDER BY ordinal_position
        `);

        console.log('Current sales_lines columns:', tableInfo.rows);

        // Add missing columns if they don't exist
        const columns = tableInfo.rows.map((row: any) => row.column_name);

        const migrations = [];

        if (!columns.includes('qty')) {
            await db.execute(sql`
                ALTER TABLE sales_lines ADD COLUMN IF NOT EXISTS qty NUMERIC NOT NULL DEFAULT 0
            `);
            migrations.push('Added qty column');
        }

        if (!columns.includes('unit_price_value')) {
            await db.execute(sql`
                ALTER TABLE sales_lines ADD COLUMN IF NOT EXISTS unit_price_value NUMERIC NOT NULL DEFAULT 0
            `);
            migrations.push('Added unit_price_value column');
        }

        if (!columns.includes('line_total_calc')) {
            await db.execute(sql`
                ALTER TABLE sales_lines ADD COLUMN IF NOT EXISTS line_total_calc NUMERIC NOT NULL DEFAULT 0
            `);
            migrations.push('Added line_total_calc column');
        }

        if (!columns.includes('amount_type')) {
            await db.execute(sql`
                ALTER TABLE sales_lines ADD COLUMN IF NOT EXISTS amount_type TEXT
            `);
            migrations.push('Added amount_type column');
        }

        if (!columns.includes('unit')) {
            await db.execute(sql`
                ALTER TABLE sales_lines ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'PC'
            `);
            migrations.push('Added unit column');
        }

        // Get updated table info
        const updatedTableInfo = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sales_lines'
            ORDER BY ordinal_position
        `);

        return NextResponse.json({
            success: true,
            message: 'Sales lines table migration completed',
            migrations,
            beforeColumns: tableInfo.rows,
            afterColumns: updatedTableInfo.rows
        });

    } catch (error) {
        console.error('Error migrating sales_lines table:', error);
        return NextResponse.json(
            {
                error: 'Failed to migrate sales_lines table',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}