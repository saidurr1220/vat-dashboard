import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format
    const category = searchParams.get('category');

    console.log('Stock Register API called with:', { month, category });

    // If no month specified, get last 3 months
    const monthsToFetch = month ? [month] : await getLastThreeMonths();
    console.log('Months to fetch:', monthsToFetch);

    const results = [];

    for (const targetMonth of monthsToFetch) {
      const [year, monthNum] = targetMonth.split('-');
      console.log(`Processing month: ${targetMonth} (Year: ${year}, Month: ${monthNum})`);

      // Get all products that have sales in this month
      let productsQuery;

      if (category && category !== 'all') {
        productsQuery = await db.execute(sql`
          SELECT DISTINCT
            p.id as item_id,
            p.sku as item_sku,
            p.name as item_name,
            p.category,
            p.unit,
            p.stock_on_hand as current_stock
          FROM products p
          JOIN sales_lines sl ON p.id = sl.product_id
          JOIN sales s ON sl.sale_id = s.id
          WHERE EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
            AND p.category = ${category}
          ORDER BY p.name
        `);
      } else {
        productsQuery = await db.execute(sql`
          SELECT DISTINCT
            p.id as item_id,
            p.sku as item_sku,
            p.name as item_name,
            p.category,
            p.unit,
            p.stock_on_hand as current_stock
          FROM products p
          JOIN sales_lines sl ON p.id = sl.product_id
          JOIN sales s ON sl.sale_id = s.id
          WHERE EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
          ORDER BY p.name
        `);
      }

      console.log(`Found ${productsQuery.rows.length} products with sales`);

      // Process each product
      for (const product of productsQuery.rows) {
        // Get purchases for this product in this month
        const purchasesQuery = await db.execute(sql`
          SELECT 
            COALESCE(SUM(qty), 0) as total_qty,
            COALESCE(AVG(unit_price), 0) as avg_cost
          FROM imports_boe
          WHERE product_id = ${product.item_id}
            AND EXTRACT(YEAR FROM boe_date) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM boe_date) = ${parseInt(monthNum)}
        `);

        // Get sales for this product in this month
        const salesQuery = await db.execute(sql`
          SELECT COALESCE(SUM(sl.qty), 0) as total_qty
          FROM sales_lines sl
          JOIN sales s ON sl.sale_id = s.id
          WHERE sl.product_id = ${product.item_id}
            AND EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
        `);

        // Get sales invoice details
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
          WHERE sl.product_id = ${product.item_id}
            AND EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
          ORDER BY s.dt
        `);

        const purchase_qty = Number(purchasesQuery.rows[0]?.total_qty || 0);
        const sales_qty = Number(salesQuery.rows[0]?.total_qty || 0);
        const avg_unit_cost = Number(purchasesQuery.rows[0]?.avg_cost || 0);
        const current_stock = Number(product.current_stock || 0);

        // Simple calculation: opening = current - purchases + sales
        const opening_qty = Math.max(0, current_stock - purchase_qty + sales_qty);
        const closing_qty = current_stock;

        results.push({
          month: targetMonth,
          item: {
            id: product.item_id,
            sku: product.item_sku,
            name: product.item_name,
            category: product.category,
            unit: product.unit
          },
          opening_qty,
          purchase_qty,
          sales_qty,
          adjust_qty: 0,
          closing_qty,
          avg_unit_cost,
          out_invoices: invoicesQuery.rows.map((inv: any) => ({
            date: new Date(inv.date).toISOString().split('T')[0],
            invoice_no: inv.invoice_no,
            customer: inv.customer,
            qty_out: Number(inv.qty_out),
            price_excl: Number(inv.price_excl || 0),
            vat_15: Number(inv.vat_15 || 0),
            total_incl: Number(inv.total_incl || 0)
          })),
          validation: {
            warnings: [],
            errors: []
          }
        });
      }
    }

    console.log(`Total results: ${results.length}`);

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
      {
        error: 'Failed to generate stock register',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
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
