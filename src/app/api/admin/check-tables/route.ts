import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get all tables in the database
        const tables = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        const tableList = tables.rows.map(row => (row as any).table_name);

        // Check if products table exists and get its structure
        let productsInfo = null;
        if (tableList.includes('products')) {
            const columns = await db.execute(sql`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'products'
                ORDER BY ordinal_position
            `);

            const count = await db.execute(sql`SELECT COUNT(*) as count FROM products`);

            productsInfo = {
                exists: true,
                columns: columns.rows,
                recordCount: count.rows[0]
            };
        } else {
            productsInfo = { exists: false };
        }

        return NextResponse.json({
            success: true,
            totalTables: tableList.length,
            tables: tableList,
            productsTable: productsInfo
        });
    } catch (error) {
        console.error('Error checking tables:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}