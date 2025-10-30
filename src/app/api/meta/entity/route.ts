import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
    try {
        const result = await pool.query(`
      SELECT 
        entity_name,
        address,
        bin,
        initial_balance
      FROM v_vat_treasury_balance
    `);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Entity metadata not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching entity metadata:', error);
        return NextResponse.json(
            { error: 'Failed to fetch entity metadata' },
            { status: 500 }
        );
    }
}