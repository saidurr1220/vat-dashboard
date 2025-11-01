import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        console.log('Testing database connection...');

        // Test basic connection
        const result = await db.execute(sql`SELECT 1 as test`);

        // Test products table
        const productCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM products
        `);

        // Test imports table
        const importCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM imports_boe
        `);

        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            data: {
                connectionTest: result.rows[0],
                productCount: productCount.rows[0]?.count || 0,
                importCount: importCount.rows[0]?.count || 0,
                databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
                environment: process.env.NODE_ENV
            }
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Database connection failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
                environment: process.env.NODE_ENV
            },
            { status: 500 }
        );
    }
}