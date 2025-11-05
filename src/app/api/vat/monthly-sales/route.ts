import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get monthly sales summary from October 2022 onwards
        // total_value contains gross amount (VAT included)
        const result = await db.execute(sql`
            SELECT 
                EXTRACT(YEAR FROM dt) as year,
                EXTRACT(MONTH FROM dt) as month,
                COALESCE(SUM(total_value), 0) as total_gross,
                COALESCE(SUM((total_value * 15) / 115), 0) as total_vat,
                COALESCE(SUM(total_value - (total_value * 15) / 115), 0) as total_net,
                COUNT(*) as invoice_count
            FROM sales 
            WHERE dt >= '2022-10-01'
            GROUP BY EXTRACT(YEAR FROM dt), EXTRACT(MONTH FROM dt)
            ORDER BY year, month
        `);

        const monthlySales = result.rows.map((row: any) => ({
            year: parseInt(row.year),
            month: parseInt(row.month),
            totalGross: parseFloat(row.total_gross || 0),
            totalVAT: parseFloat(row.total_vat || 0),
            totalNet: parseFloat(row.total_net || 0),
            invoiceCount: parseInt(row.invoice_count || 0)
        }));

        return NextResponse.json(monthlySales);
    } catch (error) {
        console.error('Error fetching monthly sales:', error);
        return NextResponse.json(
            { error: 'Failed to fetch monthly sales' },
            { status: 500 }
        );
    }
}