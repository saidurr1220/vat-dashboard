import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Check imports
        const importsCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM imports_boe
        `);

        // Check sales
        const salesCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM sales
        `);

        // Check sales > 2 lakh
        const largeSalesCount = await db.execute(sql`
            SELECT COUNT(*) as count 
            FROM sales 
            WHERE CAST(total_value AS NUMERIC) > 200000
        `);

        // Get sample imports
        const sampleImports = await db.execute(sql`
            SELECT boe_no, boe_date, vat 
            FROM imports_boe 
            ORDER BY boe_date DESC 
            LIMIT 5
        `);

        // Get sample sales
        const sampleSales = await db.execute(sql`
            SELECT invoice_no, dt, total_value 
            FROM sales 
            ORDER BY dt DESC 
            LIMIT 5
        `);

        return NextResponse.json({
            imports: {
                total: importsCount.rows[0]?.count || 0,
                sample: sampleImports.rows
            },
            sales: {
                total: salesCount.rows[0]?.count || 0,
                largeSales: largeSalesCount.rows[0]?.count || 0,
                sample: sampleSales.rows
            }
        });
    } catch (error) {
        console.error('Error checking data:', error);
        return NextResponse.json(
            { error: 'Failed to check data' },
            { status: 500 }
        );
    }
}
