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

      // Build category filter
      const categoryFilter = category && category !== 'all'
        ? sql`AND p.category = ${category}`
        : sql``;

      // Get stock movements from stock_ledger
      const stockMovements = await db.execute(sql`
        SELECT 
          p.id as item_id,
          p.sku as item_sku,
          p.name as item_name,
          p.category,
          p.unit,
          p.stock_on_hand as current_stock,
          
          -- Opening stock (before this month)
          COALESCE((
            SELECT 
              SUM(COALESCE(sl.qty_in::numeric, 0) - COALESCE(sl.qty_out::numeric, 0))
            FROM stock_ledger sl
            WHERE sl.product_id = p.id
              AND sl.dt < DATE_TRUNC('month', TO_DATE(${targetMonth} || '-01', 'YYYY-MM-DD'))
          ), 0) as opening_qty,
          
          -- Purchases this month (qty_in from IMPORT ref_type)
          COALESCE((
            SELECT SUM(sl.qty_in::numeric)
            FROM stock_ledger sl
            WHERE sl.product_id = p.id
              AND sl.ref_type = 'IMPORT'
              AND EXTRACT(YEAR FROM sl.dt) = ${parseInt(year)}
              AND EXTRACT(MONTH FROM sl.dt) = ${parseInt(monthNum)}
          ), 0) as purchase_qty,
          
          -- Sales this month (qty_out from SALE ref_type)
          COALESCE((
            SELECT SUM(sl.qty_out::numeric)
            FROM stock_ledger sl
            WHERE sl.product_id = p.id
              AND sl.ref_type = 'SALE'
              AND EXTRACT(YEAR FROM sl.dt) = ${parseInt(year)}
              AND EXTRACT(MONTH FROM sl.dt) = ${parseInt(monthNum)}
          ), 0) as sales_qty,
          
          -- Adjustments this month (ADJUST ref_type)
          COALESCE((
            SELECT SUM(COALESCE(sl.qty_in::numeric, 0) - COALESCE(sl.qty_out::numeric, 0))
            FROM stock_ledger sl
            WHERE sl.product_id = p.id
              AND sl.ref_type = 'ADJUST'
              AND EXTRACT(YEAR FROM sl.dt) = ${parseInt(year)}
              AND EXTRACT(MONTH FROM sl.dt) = ${parseInt(monthNum)}
          ), 0) as adjust_qty,
          
          -- Average unit cost
          COALESCE((
            SELECT AVG(sl.unit_cost_ex_vat::numeric)
            FROM stock_ledger sl
            WHERE sl.product_id = p.id
              AND sl.ref_type = 'IMPORT'
              AND sl.unit_cost_ex_vat IS NOT NULL
              AND EXTRACT(YEAR FROM sl.dt) = ${parseInt(year)}
              AND EXTRACT(MONTH FROM sl.dt) = ${parseInt(monthNum)}
          ), 0) as avg_unit_cost
          
        FROM products p
        WHERE EXISTS (
          SELECT 1 FROM stock_ledger sl
          WHERE sl.product_id = p.id
            AND EXTRACT(YEAR FROM sl.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM sl.dt) = ${parseInt(monthNum)}
        )
        ${categoryFilter}
        ORDER BY p.name
      `);

      console.log(`Found ${stockMovements.rows.length} products with movements`);

      // Process each product
      for (const row of stockMovements.rows) {
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
          WHERE sl.product_id = ${row.item_id}
            AND EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
            AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
          ORDER BY s.dt
        `);

        const opening_qty = Number(row.opening_qty || 0);
        const purchase_qty = Number(row.purchase_qty || 0);
        const sales_qty = Number(row.sales_qty || 0);
        const adjust_qty = Number(row.adjust_qty || 0);
        const closing_qty = opening_qty + purchase_qty - sales_qty + adjust_qty;

        results.push({
          month: targetMonth,
          item: {
            id: row.item_id,
            sku: row.item_sku,
            name: row.item_name,
            category: row.category,
            unit: row.unit
          },
          opening_qty,
          purchase_qty,
          sales_qty,
          adjust_qty,
          closing_qty,
          avg_unit_cost: Number(row.avg_unit_cost || 0),
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
        details: error instanceof Error ? error.message : 'Unknown error'
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
