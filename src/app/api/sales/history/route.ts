import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const categories = searchParams.get('categories'); // comma-separated
    const limit = parseInt(searchParams.get('limit') || '500');

    let whereConditions = [];

    if (year) {
      whereConditions.push(`EXTRACT(YEAR FROM s.dt) = ${parseInt(year)}`);
    }

    if (month) {
      whereConditions.push(`EXTRACT(MONTH FROM s.dt) = ${parseInt(month)}`);
    }

    // Category filter - join with products through sales_lines
    let categoryJoin = '';
    if (categories) {
      const categoryList = categories.split(',').map(c => `'${c.trim()}'`).join(',');
      categoryJoin = `
                INNER JOIN sales_lines sl_cat ON s.id = sl_cat.sale_id
                INNER JOIN products p_cat ON sl_cat.product_id = p_cat.id
            `;
      whereConditions.push(`p_cat.category IN (${categoryList})`);
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
        COUNT(DISTINCT sl.id) as "itemCount",
        SUM(sl.qty::numeric) as "totalQuantity"
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      ${categoryJoin}
      ${whereClause}
      GROUP BY s.id, s.invoice_no, s.dt, s.customer, s.amount_type, s.total_value, s.notes, c.name, c.address, c.phone
      ORDER BY s.dt DESC, s.id DESC
      LIMIT ${limit}
    `;

    const result = await db.execute(sql.raw(query));

    // Calculate VAT amounts for each sale
    // total_value contains gross amount (VAT included)
    const salesWithVat = result.rows.map((sale: any) => {
      const totalValue = Number(sale.totalValue);
      const vatAmount = (totalValue * 15) / 115;
      const netOfVat = totalValue - vatAmount;
      const grandTotal = totalValue;

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
        COUNT(DISTINCT s.id) as "totalSales",
        SUM(s.total_value::numeric) as "totalRevenue",
        AVG(s.total_value::numeric) as "avgSaleValue"
      FROM sales s
      LEFT JOIN sales_lines sl ON s.id = sl.sale_id
      ${categoryJoin}
      ${whereClause}
    `;

    const summaryResult = await db.execute(sql.raw(summaryQuery));
    const summary = summaryResult.rows[0];

    // Get category-wise breakdown
    // line_total_calc contains net amount (VAT excluded)
    const categoryQuery = `
      SELECT 
        p.category,
        p.hs_code as "hsCode",
        COUNT(DISTINCT s.id) as "saleCount",
        SUM(sl.qty::numeric) as "totalQuantity",
        SUM(sl.line_total_calc::numeric) as "netSales",
        SUM(sl.line_total_calc::numeric * 0.15) as "vatAmount",
        SUM(sl.line_total_calc::numeric * 1.15) as "grossSales"
      FROM sales s
      INNER JOIN sales_lines sl ON s.id = sl.sale_id
      INNER JOIN products p ON sl.product_id = p.id
      ${whereClause.replace('sl_cat', 'sl').replace('p_cat', 'p')}
      GROUP BY p.category, p.hs_code
      ORDER BY "grossSales" DESC
    `;

    const categoryResult = await db.execute(sql.raw(categoryQuery));
    const categoryBreakdown = categoryResult.rows.map((row: any) => ({
      category: row.category,
      hsCode: row.hsCode,
      saleCount: Number(row.saleCount || 0),
      totalQuantity: Number(row.totalQuantity || 0),
      netSales: Number(row.netSales || 0).toFixed(2),
      vatAmount: Number(row.vatAmount || 0).toFixed(2),
      grossSales: Number(row.grossSales || 0).toFixed(2),
    }));

    return NextResponse.json({
      sales: salesWithVat,
      summary: {
        totalSales: Number(summary?.totalSales || 0),
        totalRevenue: Number(summary?.totalRevenue || 0),
        avgSaleValue: Number(summary?.avgSaleValue || 0),
      },
      categoryBreakdown,
      filters: {
        year: year ? parseInt(year) : null,
        month: month ? parseInt(month) : null,
        categories: categories ? categories.split(',') : [],
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