import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: 'Invalid product ID' },
                { status: 400 }
            );
        }

        // Get sales history for this product
        const salesHistory = await db.execute(sql`
      SELECT 
        sl.id,
        s.invoice_no as "invoiceNo",
        s.dt as date,
        s.customer,
        sl.qty::numeric as qty,
        sl.unit_price_value::numeric as "unitPrice",
        sl.line_total_calc::numeric as "lineTotal"
      FROM sales_lines sl
      JOIN sales s ON sl.sale_id = s.id
      WHERE sl.product_id = ${productId}
      ORDER BY s.dt DESC, s.id DESC
      LIMIT 50
    `);

        const soldItems = salesHistory.rows.map((item: any) => ({
            id: item.id,
            invoiceNo: item.invoiceNo,
            date: item.date,
            customer: item.customer,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal)
        }));

        return NextResponse.json(soldItems);

    } catch (error) {
        console.error('Error fetching product sales:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product sales' },
            { status: 500 }
        );
    }
}