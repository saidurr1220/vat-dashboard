import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { vatLedger } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Check if vat_ledger table exists and has data, otherwise return empty array
        const result = await db.execute(sql`
            SELECT 
                period_year as year,
                period_month as month,
                COALESCE(gross_sales, 0) as "grossSales",
                COALESCE(net_sales_ex_vat, 0) as "netSalesExVat", 
                COALESCE(vat_payable, 0) as "vatPayable",
                COALESCE(used_from_closing_balance, 0) as "usedFromClosingBalance",
                COALESCE(treasury_needed, 0) as "treasuryNeeded",
                COALESCE(locked, true) as locked
            FROM vat_ledger 
            ORDER BY period_year, period_month
        `);

        const computations = result.rows.map((row: any) => ({
            year: row.year,
            month: row.month,
            grossSales: parseFloat(row.grossSales || '0'),
            netSalesExVat: parseFloat(row.netSalesExVat || '0'),
            vatPayable: parseFloat(row.vatPayable || '0'),
            usedFromClosingBalance: parseFloat(row.usedFromClosingBalance || '0'),
            treasuryNeeded: parseFloat(row.treasuryNeeded || '0'),
            locked: row.locked
        }));

        return NextResponse.json(computations);
    } catch (error) {
        console.error('Error fetching VAT computations:', error);
        // Return empty array if table doesn't exist or has issues
        return NextResponse.json([]);
    }
}