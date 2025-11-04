import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const currentDate = new Date();
        const targetMonth = searchParams.get('month') || (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const targetYear = searchParams.get('year') || currentDate.getFullYear().toString();

        // Purchase Register - All BOE imports
        const purchasesResult = await db.execute(sql`
            SELECT 
                ib.id,
                ib.boe_no,
                ib.boe_date,
                COALESCE(ib.office_code, '') as office_code,
                COALESCE(ib.item_no, '') as item_no,
                ib.description,
                COALESCE(ib.hs_code, '') as hs_code,
                CAST(COALESCE(ib.qty, 0) AS NUMERIC) as qty,
                COALESCE(ib.unit, '') as unit,
                CAST(COALESCE(ib.assessable_value, 0) AS NUMERIC) as assessable_value,
                CAST(COALESCE(ib.base_vat, 0) AS NUMERIC) as base_vat,
                CAST(COALESCE(ib.sd, 0) AS NUMERIC) as sd,
                CAST(COALESCE(ib.vat, 0) AS NUMERIC) as vat,
                CAST(COALESCE(ib.at, 0) AS NUMERIC) as at,
                (CAST(COALESCE(ib.assessable_value, 0) AS NUMERIC) + 
                 CAST(COALESCE(ib.base_vat, 0) AS NUMERIC) + 
                 CAST(COALESCE(ib.sd, 0) AS NUMERIC) + 
                 CAST(COALESCE(ib.vat, 0) AS NUMERIC) + 
                 CAST(COALESCE(ib.at, 0) AS NUMERIC)) as total_value
            FROM imports_boe ib
            WHERE EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(targetMonth)}
                AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(targetYear)}
            ORDER BY ib.boe_date, ib.boe_no, ib.item_no
        `);

        // Part B: Sales > 2 Lakh
        const salesResult = await db.execute(sql`
            SELECT 
                s.invoice_no,
                s.dt as sale_date,
                s.customer,
                c.bin as customer_bin,
                CAST(s.total_value AS NUMERIC) as total_value,
                CASE 
                    WHEN s.amount_type = 'INCL' THEN CAST(s.total_value AS NUMERIC) * 0.15 / 1.15
                    ELSE CAST(s.total_value AS NUMERIC) * 0.15
                END as vat_amount,
                s.amount_type
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
                AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
                AND CAST(s.total_value AS NUMERIC) > 200000
            ORDER BY s.dt, s.invoice_no
        `);

        const purchaseTotals = {
            assessableValue: purchasesResult.rows.reduce((sum, row: any) => sum + Number(row.assessable_value || 0), 0),
            vat: purchasesResult.rows.reduce((sum, row: any) => sum + Number(row.vat || 0), 0),
            totalValue: purchasesResult.rows.reduce((sum, row: any) => sum + Number(row.total_value || 0), 0),
        };

        const salesTotals = {
            totalValue: salesResult.rows.reduce((sum, row: any) => sum + Number(row.total_value || 0), 0),
            vat: salesResult.rows.reduce((sum, row: any) => sum + Number(row.vat_amount || 0), 0),
        };

        return NextResponse.json({
            purchases: purchasesResult.rows,
            sales: salesResult.rows,
            purchaseTotals,
            salesTotals,
            netVAT: salesTotals.vat - purchaseTotals.vat,
        });
    } catch (error) {
        console.error('Error fetching VAT register data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}
