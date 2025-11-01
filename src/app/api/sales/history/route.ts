import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const limit = parseInt(searchParams.get('limit') || '100');

        let whereConditions = [];

        if (year) {
            whereConditions.push(`EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}`);
        }

        if (month) {
            whereConditions.push(`EXTRACT(MONTH FROM s.dt) = ${parseInt(month)}`);
        }

        const whereClause = whereConditions.length > 0 ?
            `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
      SELECT 
        s.id,
        s.invoice_no as "invoiceNo",
        s.dt,
        s.customer,
        s.amount_type as "amountType",
        s.total_value as "totalValue",
        s.notes,
        c.name as "customerName",
        c.address as "customerAddress",
        c.phone as "customerPhone",
        COUNT(sl.id) as "itemCount",
        SUM(sl.qty::numeric) as "totalQuantity"
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      ${whereClause}
      GROUP BY s.id, s.invoice_no, s.dt, s.customer, s.amount_type, s.total_value, s.notes, c.name, c.address, c.phone
      ORDER BY s.dt DESC, s.id DESC
      LIMIT ${limit}
    `;

        const result = await db.execute(sql.raw(query));

        // Calculate VAT amounts for each sale
        const salesWithVat = result.rows.map((sale: any) => {
            const totalValue = Number(sale.totalValue);
            const vatAmount = sale.amountType === 'INCL'
                ? (totalValue * 0.15) / 1.15
                : totalValue * 0.15;
            const netOfVat = sale.amountType === 'INCL'
                ? totalValue - vatAmount
                : totalValue;
            const grandTotal = sale.amountType === 'INCL'
                ? totalValue
                : totalValue + vatAmount;

            return {
                ...sale,
                vatAmount: vatAmount.toFixed(2),
                netOfVat: netOfVat.toFixed(2),
                grandTotal: grandTotal.toFixed(2),
                customerDisplay: sale.customerName || sale.customer,
                itemCount: Number(sale.itemCount || 0),
                totalQuantity: Number(sale.totalQuantity || 0),
            };
        });

        // Get summary statistics
        const summaryQuery = `
      SELECT 
        COUNT(*) as "totalSales",
        SUM(s.total_value::numeric) as "totalRevenue",
        AVG(s.total_value::numeric) as "avgSaleValue"
      FROM sales s
      ${whereClause}
    `;

        const summaryResult = await db.execute(sql.raw(summaryQuery));
        const summary = summaryResult.rows[0];

        return NextResponse.json({
            sales: salesWithVat,
            summary: {
                totalSales: Number(summary?.totalSales || 0),
                totalRevenue: Number(summary?.totalRevenue || 0),
                avgSaleValue: Number(summary?.avgSaleValue || 0),
            },
            filters: {
                year: year ? parseInt(year) : null,
                month: month ? parseInt(month) : null,
                limit,
            }
        });
    } catch (error) {
        console.error('Error fetching sales history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sales history' },
            { status: 500 }
        );
    }
}