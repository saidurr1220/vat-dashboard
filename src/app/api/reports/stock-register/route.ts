import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // YYYY-MM format
        const category = searchParams.get('category');

        // If no month specified, get last 3 months
        const monthsToFetch = month ? [month] : await getLastThreeMonths();

        const results = [];

        for (const targetMonth of monthsToFetch) {
            const [year, monthNum] = targetMonth.split('-');

            // Get all products with their movements
            const stockQuery = await db.execute(sql`
        WITH monthly_purchases AS (
          SELECT 
            p.id as item_id,
            p.sku as item_sku,
            p.name as item_name,
            p.category,
            p.unit,
            COALESCE(SUM(ib.qty), 0) as purchase_qty,
            COALESCE(AVG(ib.unit_price), 0) as avg_unit_cost
          FROM products p
          LEFT JOIN imports_boe ib ON p.id = ib.product_id
            AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(monthNum)}
          GROUP BY p.id, p.sku, p.name, p.category, p.unit
        ),
        monthly_sales AS (
          SELECT 
            p.id as item_id,
            COALESCE(SUM(sl.qty), 0) as sales_qty
          FROM products p
          LEFT JOIN sales_lines sl ON p.id = sl.product_id
          LEFT JOIN sales s ON sl.sale_id = s.id
            AND EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
          GROUP BY p.id
        ),
        sales_invoices AS (
          SELECT 
            sl.product_id as item_id,
            s.invoice_no,
            s.dt as date,
            s.customer,
            sl.qty as qty_out,
            sl.unit_price_value as price_excl,
            (sl.line_total_calc - sl.unit_price_value * sl.qty) as vat_15,
            sl.line_total_calc as total_incl
          FROM sales_lines sl
          JOIN sales s ON sl.sale_id = s.id
          WHERE EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
        )
        SELECT 
          mp.item_id,
          mp.item_sku,
          mp.item_name,
          mp.category,
          mp.unit,
          mp.purchase_qty,
          mp.avg_unit_cost,
          COALESCE(ms.sales_qty, 0) as sales_qty,
          p.stock_on_hand as current_stock
        FROM monthly_purchases mp
        LEFT JOIN monthly_sales ms ON mp.item_id = ms.item_id
        LEFT JOIN products p ON mp.item_id = p.id
        WHERE (${category ? sql`mp.category = ${category}` : sql`1=1`})
        ORDER BY mp.item_name
      `);

            // Get invoice details for each product
            for (const row of stockQuery.rows) {
                const invoicesQuery = await db.execute(sql`
          SELECT 
            s.invoice_no,
            s.dt as date,
            s.customer,
            sl.qty as qty_out,
            sl.unit_price_value as price_excl,
            (sl.line_total_calc - sl.unit_price_value * sl.qty) as vat_15,
            sl.line_total_calc as total_incl
          FROM sales_lines sl
          JOIN sales s ON sl.sale_id = s.id
          WHERE sl.product_id = ${row.item_id}
            AND EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
          ORDER BY s.dt
        `);

                results.push({
                    month: targetMonth,
                    item: {
                        id: row.item_id,
                        sku: row.item_sku,
                        name: row.item_name,
                        category: row.category,
                        unit: row.unit
                    },
                    opening_qty: 0, // Will be calculated from previous month
                    purchase_qty: Number(row.purchase_qty || 0),
                    sales_qty: Number(row.sales_qty || 0),
                    adjust_qty: 0,
                    closing_qty: Number(row.current_stock || 0),
                    avg_unit_cost: Number(row.avg_unit_cost || 0),
                    out_invoices: invoicesQuery.rows.map((inv: any) => ({
                        date: new Date(inv.date).toISOString().split('T')[0],
                        invoice_no: inv.invoice_no,
                        customer: inv.customer,
                        qty_out: Number(inv.qty_out),
                        price_excl: Number(inv.price_excl),
                        vat_15: Number(inv.vat_15),
                        total_incl: Number(inv.total_incl)
                    })),
                    validation: {
                        warnings: [],
                        errors: []
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: results,
            summary: {
                total_items: results.length,
                months: monthsToFetch
            }
        });

    } catch (error) {
        console.error('Stock register error:', error);
        return NextResponse.json(
            { error: 'Failed to generate stock register' },
            { status: 500 }
        );
    }
}

async function getLastThreeMonths(): Promise<string[]> {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push(month);
    }

    return months;
}
