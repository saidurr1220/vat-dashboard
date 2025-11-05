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

      // Build category filter
      const categoryFilter = category && category !== 'all'
        ? sql`AND p.category = ${category}`
        : sql``;

      // Get products with purchases in this month
      const purchasesQuery = await db.execute(sql`
                SELECT 
                    p.id as item_id,
                    p.sku as item_sku,
                    p.name as item_name,
                    p.category,
                    p.unit,
                    p.stock_on_hand as current_stock,
                    COALESCE(SUM(ib.qty), 0) as purchase_qty,
                    COALESCE(AVG(ib.unit_price), 0) as avg_unit_cost
                FROM products p
                INNER JOIN imports_boe ib ON p.id = ib.product_id
                WHERE EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(year)}
                    AND EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(monthNum)}
                    ${categoryFilter}
                GROUP BY p.id, p.sku, p.name, p.category, p.unit, p.stock_on_hand
            `);

      // Get products with sales in this month
      const salesQuery = await db.execute(sql`
                SELECT 
                    p.id as item_id,
                    p.sku as item_sku,
                    p.name as item_name,
                    p.category,
                    p.unit,
                    p.stock_on_hand as current_stock,
                    COALESCE(SUM(sl.qty), 0) as sales_qty
                FROM products p
                INNER JOIN sales_lines sl ON p.id = sl.product_id
                INNER JOIN sales s ON sl.sale_id = s.id
                WHERE EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
                    AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
                    ${categoryFilter}
                GROUP BY p.id, p.sku, p.name, p.category, p.unit, p.stock_on_hand
            `);

      // Combine purchases and sales data
      const itemsMap = new Map();

      // Add purchases
      for (const row of purchasesQuery.rows) {
        itemsMap.set(row.item_id, {
          item_id: row.item_id,
          item_sku: row.item_sku,
          item_name: row.item_name,
          category: row.category,
          unit: row.unit,
          current_stock: Number(row.current_stock || 0),
          purchase_qty: Number(row.purchase_qty || 0),
          avg_unit_cost: Number(row.avg_unit_cost || 0),
          sales_qty: 0
        });
      }

      // Add sales
      for (const row of salesQuery.rows) {
        if (itemsMap.has(row.item_id)) {
          itemsMap.get(row.item_id).sales_qty = Number(row.sales_qty || 0);
        } else {
          itemsMap.set(row.item_id, {
            item_id: row.item_id,
            item_sku: row.item_sku,
            item_name: row.item_name,
            category: row.category,
            unit: row.unit,
            current_stock: Number(row.current_stock || 0),
            purchase_qty: 0,
            avg_unit_cost: 0,
            sales_qty: Number(row.sales_qty || 0)
          });
        }
      }

      // Process each item
      for (const [itemId, itemData] of itemsMap) {
        // Get invoice details for this product
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
                    WHERE sl.product_id = ${itemId}
                        AND EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}
                        AND EXTRACT(MONTH FROM s.dt) = ${parseInt(monthNum)}
                    ORDER BY s.dt
                `);

        // Calculate opening stock (current - purchases + sales)
        const opening_qty = itemData.current_stock - itemData.purchase_qty + itemData.sales_qty;

        results.push({
          month: targetMonth,
          item: {
            id: itemData.item_id,
            sku: itemData.item_sku,
            name: itemData.item_name,
            category: itemData.category,
            unit: itemData.unit
          },
          opening_qty: Math.max(0, opening_qty),
          purchase_qty: itemData.purchase_qty,
          sales_qty: itemData.sales_qty,
          adjust_qty: 0,
          closing_qty: itemData.current_stock,
          avg_unit_cost: itemData.avg_unit_cost,
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
      { error: 'Failed to generate stock register', details: error instanceof Error ? error.message : 'Unknown error' },
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
