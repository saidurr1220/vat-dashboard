import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        // Get the latest sale (most recent by created_at)
        const result = await db.execute(sql`
      SELECT 
        s.id,
        s.invoice_no as "invoiceNo",
        s.dt,
        s.customer,
        s.total_value as "totalValue",
        s.amount_type as "amountType",
        s.created_at as "createdAt"
      FROM sales s
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT 1
    `);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'No sales data available' },
                { status: 404 }
            );
        }

        const latestSale = result.rows[0];

        // Sanitize data - remove any potential PII/secrets
        const publicData = {
            id: latestSale.id,
            invoiceNo: latestSale.invoiceNo,
            date: latestSale.dt,
            customerName: latestSale.customer, // Keep customer name as it's business data
            totalValue: Number(latestSale.totalValue),
            amountType: latestSale.amountType,
            createdAt: latestSale.createdAt,
            timestamp: new Date().toISOString()
        };

        const response = NextResponse.json(publicData);

        // Set cache headers as required
        response.headers.set('Cache-Control', 'public, max-age=30');

        return response;
    } catch (error) {
        console.error('Error fetching latest data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch latest data' },
            { status: 500 }
        );
    }
}

// Only allow GET requests
export async function POST() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}