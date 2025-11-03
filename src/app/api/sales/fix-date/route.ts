import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sales } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { saleId, newDate } = body;

        if (!saleId || !newDate) {
            return NextResponse.json(
                { error: 'Sale ID and new date are required' },
                { status: 400 }
            );
        }

        // Validate date
        const parsedDate = new Date(newDate);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        // Update the sale date
        await db
            .update(sales)
            .set({ dt: parsedDate })
            .where(eq(sales.id, saleId));

        return NextResponse.json({
            success: true,
            message: 'Sale date updated successfully'
        });

    } catch (error) {
        console.error('Error updating sale date:', error);
        return NextResponse.json(
            { error: 'Failed to update sale date' },
            { status: 500 }
        );
    }
}
