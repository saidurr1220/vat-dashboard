import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `${year}${month}`;

        // Get the latest invoice number for current month
        const result = await db.execute(sql`
            SELECT invoice_no 
            FROM sales 
            WHERE invoice_no LIKE ${prefix + '%'}
            ORDER BY invoice_no DESC 
            LIMIT 1
        `);

        let nextSequence = 1;

        if (result.rows.length > 0) {
            const lastInvoice = result.rows[0].invoice_no as string;
            const lastSequence = parseInt(lastInvoice.slice(-2)); // Get last 2 digits
            nextSequence = lastSequence + 1;
        }

        const nextInvoiceNo = `${prefix}${nextSequence.toString().padStart(2, '0')}`;

        return NextResponse.json({ nextInvoiceNo });
    } catch (error) {
        console.error('Error generating invoice number:', error);
        return NextResponse.json(
            { error: 'Failed to generate invoice number' },
            { status: 500 }
        );
    }
}