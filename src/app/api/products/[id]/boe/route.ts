import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { boeLots } from '@/db/footwear-schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: 'Invalid product ID' },
                { status: 400 }
            );
        }

        // Get all BoE lots for this product
        const lots = await db
            .select({
                id: boeLots.id,
                lotId: boeLots.lotId,
                boeNumber: boeLots.boeNumber,
                boeItemNo: boeLots.boeItemNo,
                boeDate: boeLots.boeDate,
                description: boeLots.description,
                hsCode: boeLots.hsCode,
                baseValue: boeLots.baseValue,
                sdValue: boeLots.sdValue,
                unitPurchaseCost: boeLots.unitPurchaseCost,
                category: boeLots.category,
                month: boeLots.month,
                cartonSize: boeLots.cartonSize,
                openingPairs: boeLots.openingPairs,
                closingPairs: boeLots.closingPairs,
                declaredUnitValue: boeLots.declaredUnitValue,
                createdAt: boeLots.createdAt
            })
            .from(boeLots)
            .where(eq(boeLots.productId, productId))
            .orderBy(desc(boeLots.boeDate));

        // Calculate summary statistics
        const summary = {
            totalLots: lots.length,
            totalOpeningPairs: lots.reduce((sum, lot) => sum + (lot.openingPairs || 0), 0),
            totalClosingPairs: lots.reduce((sum, lot) => sum + (lot.closingPairs || 0), 0),
            totalBaseValue: lots.reduce((sum, lot) => sum + parseFloat(lot.baseValue || '0'), 0),
            totalSdValue: lots.reduce((sum, lot) => sum + parseFloat(lot.sdValue || '0'), 0),
            averageUnitCost: lots.length > 0
                ? lots.reduce((sum, lot) => sum + parseFloat(lot.unitPurchaseCost || '0'), 0) / lots.length
                : 0,
            oldestLot: lots.length > 0 ? lots[lots.length - 1] : null,
            newestLot: lots.length > 0 ? lots[0] : null
        };

        return NextResponse.json({
            lots,
            summary
        });

    } catch (error) {
        console.error('Error fetching BoE data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch BoE data' },
            { status: 500 }
        );
    }
}