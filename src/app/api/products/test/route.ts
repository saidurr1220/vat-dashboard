import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Test basic connection
        await db.execute(sql`SELECT 1`);

        // Check if products table exists and get its structure
        const tableInfo = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products'
            ORDER BY ordinal_position
        `);

        // Try to get products count
        const count = await db.execute(sql`SELECT COUNT(*) as count FROM products`);

        // Try to get a sample product
        const sample = await db.execute(sql`SELECT * FROM products LIMIT 1`);

        return NextResponse.json({
            success: true,
            tableExists: tableInfo.rows.length > 0,
            columns: tableInfo.rows,
            productCount: count.rows[0],
            sampleProduct: sample.rows[0] || null
        });
    } catch (error) {
        console.error('Products test failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error
        }, { status: 500 });
    }
}