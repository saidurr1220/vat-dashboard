import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = `
      SELECT 
        challan_no,
        bank,
        branch,
        date,
        account_code,
        amount,
        notes
      FROM vat_challans_kiro
    `;

        const params: any[] = [];

        if (year) {
            query += ' WHERE EXTRACT(YEAR FROM date) = $1';
            params.push(parseInt(year));
        }

        query += ' ORDER BY date ASC';

        if (limit > 0) {
            query += ` LIMIT ${limit}`;
        }

        const result = await pool.query(query, params);

        // Calculate summary
        const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_challans,
        SUM(amount) as total_amount,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM vat_challans_kiro
      ${year ? 'WHERE EXTRACT(YEAR FROM date) = $1' : ''}
    `, year ? [parseInt(year)] : []);

        return NextResponse.json({
            success: true,
            data: result.rows,
            summary: summary.rows[0],
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching VAT challans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch VAT challans' },
            { status: 500 }
        );
    }
}