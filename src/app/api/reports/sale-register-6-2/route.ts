import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const currentDate = new Date();
        const targetMonth = searchParams.get('month') || (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const targetYear = searchParams.get('year') || currentDate.getFullYear().toString();

        // Sales Register - All sales invoices including bulk sales
        const salesResult = await db.execute(sql`
            SELECT 
                s.invoice_no,
                s.dt as sale_date,
                s.customer,
                COALESCE(c.bin, c.nid, '') as customer_bin,
                COALESCE(c.address, '') as customer_address,
                CAST(s.total_value AS NUMERIC) as total_value,
                -- VAT calculation: total_value always includes VAT
                CAST(s.total_value AS NUMERIC) * 0.15 / 1.15 as vat_amount,
                -- Taxable value: total_value minus VAT
                CAST(s.total_value AS NUMERIC) / 1.15 as taxable_value,
                s.amount_type,
                s.notes
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
                AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
            ORDER BY s.dt, s.invoice_no
        `);

        // Get sales lines for product details
        const salesLinesResult = await db.execute(sql`
            SELECT 
                sl.sale_id,
                s.invoice_no,
                p.name as product_name,
                p.hs_code,
                sl.qty,
                sl.unit,
                CAST(sl.unit_price_value AS NUMERIC) as unit_price,
                CAST(sl.line_total_calc AS NUMERIC) as line_total
            FROM sales_lines sl
            JOIN sales s ON sl.sale_id = s.id
            JOIN products p ON sl.product_id = p.id
            WHERE EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
                AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
            ORDER BY s.dt, s.invoice_no, sl.id
        `);

        return NextResponse.json({
            sales: salesResult.rows,
            salesLines: salesLinesResult.rows,
            period: {
                month: targetMonth,
                year: targetYear
            }
        });
    } catch (error) {
        console.error('Error fetching sale register data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
