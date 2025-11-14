import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const currentDate = new Date();
        const targetMonth = searchParams.get('month') || (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const targetYear = searchParams.get('year') || currentDate.getFullYear().toString();

        // Threshold for Mushok 6.10 - sales above 200,000 BDT
        const threshold = 200000;

        // Purchase data (imports above threshold)
        const purchasesResult = await db.execute(sql`
            SELECT 
                ib.boe_no as invoice_no,
                ib.boe_date as transaction_date,
                CAST(ib.assessable_value AS NUMERIC) as value,
                'Import' as supplier_name,
                '' as supplier_address,
                '' as supplier_bin
            FROM imports_boe ib
            WHERE EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(targetMonth)}
                AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(targetYear)}
                AND CAST(ib.assessable_value AS NUMERIC) > ${threshold}
            ORDER BY ib.boe_date, ib.boe_no
        `);

        // Sales data above threshold
        // Display taxable value (excl VAT) and check threshold on same
        const salesResult = await db.execute(sql`
            SELECT DISTINCT ON (s.id)
                s.invoice_no,
                s.dt as transaction_date,
                CAST(s.total_value AS NUMERIC) / 1.15 as value,
                s.customer as buyer_name,
                COALESCE(c.address, c2.address, '') as buyer_address,
                COALESCE(c.bin, c.nid, c2.bin, c2.nid, '') as buyer_bin
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN customers c2 ON LOWER(TRIM(s.customer)) = LOWER(TRIM(c2.name)) AND c.id IS NULL
            WHERE EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
                AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
                AND CAST(s.total_value AS NUMERIC) / 1.15 > ${threshold}
            ORDER BY s.id, s.dt, s.invoice_no
        `);

        return NextResponse.json({
            purchases: purchasesResult.rows,
            sales: salesResult.rows,
            period: {
                month: targetMonth,
                year: targetYear
            },
            threshold: threshold
        });
    } catch (error) {
        console.error('Error fetching Mushok 6.10 data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
