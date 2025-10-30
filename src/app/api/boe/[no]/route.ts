import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ no: string }> }
) {
    try {
        const { no: boeNo } = await params;

        if (!boeNo) {
            return NextResponse.json(
                { error: 'BoE number is required' },
                { status: 400 }
            );
        }

        const result = await pool.query(`
      SELECT 
        boe_no,
        boe_date,
        boe_item,
        product,
        hs_code,
        category,
        unit,
        qty_in,
        unit_purchase,
        declared_unit_value,
        source
      FROM v_boe_trace
      WHERE boe_no = $1
      ORDER BY boe_item
    `, [boeNo]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'BoE not found' },
                { status: 404 }
            );
        }

        // Calculate summary
        const summary = {
            boe_no: boeNo,
            boe_date: result.rows[0].boe_date,
            total_items: result.rows.length,
            total_qty: result.rows.reduce((sum, row) => sum + Number(row.qty_in), 0),
            total_value: result.rows.reduce((sum, row) => sum + (Number(row.qty_in) * Number(row.unit_purchase)), 0)
        };

        return NextResponse.json({
            success: true,
            summary,
            items: result.rows
        });

    } catch (error) {
        console.error('Error fetching BoE trace:', error);
        return NextResponse.json(
            { error: 'Failed to fetch BoE trace' },
            { status: 500 }
        );
    }
}