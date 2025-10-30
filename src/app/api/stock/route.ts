import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sort') || 'value_sell';
        const order = searchParams.get('order') || 'DESC';
        const category = searchParams.get('category');

        let query = `
      SELECT 
        category,
        product,
        boe_no,
        boe_date,
        qty_on_hand,
        cost_price,
        selling_price,
        vat_rate,
        value_cost,
        value_sell,
        unit
      FROM v_stock_position
    `;

        const params: any[] = [];

        if (category) {
            query += ' WHERE category ILIKE $1';
            params.push(`%${category}%`);
        }

        // Validate sort column
        const validSortColumns = ['value_sell', 'value_cost', 'boe_date', 'qty_on_hand', 'product'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'value_sell';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortColumn} ${sortOrder}`;

        const result = await pool.query(query, params);

        // Calculate totals
        const totals = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(qty_on_hand) as total_qty,
        SUM(value_cost) as total_cost_value,
        SUM(value_sell) as total_sell_value
      FROM v_stock_position
      ${category ? 'WHERE category ILIKE $1' : ''}
    `, category ? [`%${category}%`] : []);

        return NextResponse.json({
            success: true,
            data: result.rows,
            totals: totals.rows[0],
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching stock position:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock position' },
            { status: 500 }
        );
    }
}