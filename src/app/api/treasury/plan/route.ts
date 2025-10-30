import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
    try {
        const result = await pool.query(`
      SELECT 
        month,
        opening_balance,
        planned_sales_vat_use,
        planned_treasury_transfer,
        closing_balance
      FROM treasury_plan_kiro
      ORDER BY 
        CASE 
          WHEN month ~ '^[0-9]{4}-[0-9]{2}$' THEN month
          ELSE '9999-' || LPAD(
            CASE month
              WHEN 'January' THEN '01'
              WHEN 'February' THEN '02'
              WHEN 'March' THEN '03'
              WHEN 'April' THEN '04'
              WHEN 'May' THEN '05'
              WHEN 'June' THEN '06'
              WHEN 'July' THEN '07'
              WHEN 'August' THEN '08'
              WHEN 'September' THEN '09'
              WHEN 'October' THEN '10'
              WHEN 'November' THEN '11'
              WHEN 'December' THEN '12'
              ELSE '00'
            END, 2, '0')
        END
    `);

        // Calculate summary
        const summary = {
            total_periods: result.rows.length,
            total_opening_balance: result.rows.reduce((sum, row) => sum + Number(row.opening_balance || 0), 0),
            total_planned_vat_use: result.rows.reduce((sum, row) => sum + Number(row.planned_sales_vat_use || 0), 0),
            total_planned_transfers: result.rows.reduce((sum, row) => sum + Number(row.planned_treasury_transfer || 0), 0),
            total_closing_balance: result.rows.reduce((sum, row) => sum + Number(row.closing_balance || 0), 0)
        };

        return NextResponse.json({
            success: true,
            data: result.rows,
            summary,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching treasury plan:', error);
        return NextResponse.json(
            { error: 'Failed to fetch treasury plan' },
            { status: 500 }
        );
    }
}