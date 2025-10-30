import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get stock summary with unified stock calculation (footwear from BoE lots, others from stock ledger)
    const result = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.unit,
        p.category,
        p.cost_ex_vat as "productCostExVat",
        p.sell_ex_vat as "sellExVat",
        CASE 
          WHEN p.category = 'Footwear' THEN 
            COALESCE((
              SELECT SUM(bl.closing_pairs)
              FROM boe_lots bl 
              WHERE bl.product_id = p.id
            ), 0)
          ELSE 
            COALESCE((
              SELECT SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric)
              FROM stock_ledger sl 
              WHERE sl.product_id = p.id
            ), 0)
        END as "stockOnHand",
        CASE 
          WHEN p.category = 'Footwear' THEN 
            COALESCE((
              SELECT 
                CASE 
                  WHEN SUM(bl.opening_pairs) > 0 THEN
                    SUM(bl.opening_pairs * bl.unit_purchase_cost::numeric) / SUM(bl.opening_pairs)
                  ELSE 0
                END
              FROM boe_lots bl 
              WHERE bl.product_id = p.id AND bl.opening_pairs > 0
            ), 0)
          ELSE 
            COALESCE((
              SELECT 
                CASE 
                  WHEN SUM(sl.qty_in::numeric) > 0 THEN
                    SUM(sl.qty_in::numeric * sl.unit_cost_ex_vat::numeric) / SUM(sl.qty_in::numeric)
                  ELSE 0
                END
              FROM stock_ledger sl 
              WHERE sl.product_id = p.id AND sl.qty_in > 0
            ), 0)
        END as "avgCostExVat"
      FROM products p
      ORDER BY p.name
    `);

    const stockSummary = result.rows.map((item: any) => {
      const stockOnHand = Number(item.stockOnHand || 0);
      const avgCostExVat = Number(item.avgCostExVat || 0);
      const productCostExVat = Number(item.productCostExVat || 0);
      const sellExVat = Number(item.sellExVat || 0);

      // Use weighted average cost if available, otherwise fall back to product cost
      const effectiveCost = avgCostExVat > 0 ? avgCostExVat : productCostExVat;

      const stockValue = stockOnHand * effectiveCost;
      const stockValueVat = stockValue * 0.15;
      const stockValueIncVat = stockValue * 1.15;

      return {
        ...item,
        stockOnHand,
        avgCostExVat,
        effectiveCost,
        stockValue,
        stockValueVat,
        stockValueIncVat,
      };
    });

    // Calculate totals
    const totals = stockSummary.reduce(
      (acc, item) => ({
        totalStockValue: acc.totalStockValue + item.stockValue,
        totalStockValueVat: acc.totalStockValueVat + item.stockValueVat,
        totalStockValueIncVat: acc.totalStockValueIncVat + item.stockValueIncVat,
      }),
      { totalStockValue: 0, totalStockValueVat: 0, totalStockValueIncVat: 0 }
    );

    return NextResponse.json({
      items: stockSummary,
      totals,
    });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock summary' },
      { status: 500 }
    );
  }
}