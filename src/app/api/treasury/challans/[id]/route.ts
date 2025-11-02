import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { treasuryChallans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export const DELETE = requireAdmin(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);

        const deletedChallan = await db
            .delete(treasuryChallans)
            .where(eq(treasuryChallans.id, id))
            .returning();

        if (deletedChallan.length === 0) {
            return NextResponse.json(
                { error: 'Treasury challan not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting treasury challan:', error);
        return NextResponse.json(
            { error: 'Failed to delete treasury challan' },
            { status: 500 }
        );
    }
});

export const PUT = requireAdmin(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const updateData = await request.json();

        const updatedChallan = await db
            .update(treasuryChallans)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(eq(treasuryChallans.id, id))
            .returning();

        if (updatedChallan.length === 0) {
            return NextResponse.json(
                { error: 'Treasury challan not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedChallan[0]);
    } catch (error) {
        console.error('Error updating treasury challan:', error);
        return NextResponse.json(
            { error: 'Failed to update treasury challan' },
            { status: 500 }
        );
    }
});