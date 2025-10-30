import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { importsBoe } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Test basic connection
        await db.execute(sql`SELECT 1`);

        // Test table access
        const count = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);

        // Test the actual query
        const sample = await db
            .select({
                id: importsBoe.id,
                boeNo: importsBoe.boeNo,
                boeDate: importsBoe.boeDate,
                description: importsBoe.description,
                qty: importsBoe.qty,
            })
            .from(importsBoe)
            .orderBy(desc(importsBoe.boeDate))
            .limit(5);

        return NextResponse.json({
            success: true,
            message: 'Database connection and queries working',
            totalRows: count.rows[0]?.count || 0,
            sampleData: sample,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('API test error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}