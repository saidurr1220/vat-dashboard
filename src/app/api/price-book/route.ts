import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const hsCode = searchParams.get('hs_code');

        let query = 'SELECT * FROM v_price_book';
        const params: any[] = [];
        const conditions: string[] = [];

        if (category) {
            conditions.push(`category ILIKE $${params.length + 1}`);
            params.push(`%${category}%`);
        }

        if (hsCode) {
            conditions.push(`hs_code = $${params.length + 1}`);
            params.push(hsCode);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY category, product';

        const result = await pool.query(query, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching price book:', error);
        return NextResponse.json(
            { error: 'Failed to fetch price book' },
            { status: 500 }
        );
    }
}