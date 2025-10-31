import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { importsBoe } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            boeNo,
            boeDate,
            officeCode,
            itemNo,
            hsCode,
            description,
            assessableValue,
            baseVat,
            sd,
            vat,
            at,
            qty,
            unit
        } = body;

        // Validate required fields
        if (!boeNo || !boeDate || !itemNo) {
            return NextResponse.json(
                { success: false, message: 'BoE Number, Date, and Item Number are required' },
                { status: 400 }
            );
        }

        // Validate date format
        const parsedDate = new Date(boeDate);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json(
                { success: false, message: 'Invalid date format' },
                { status: 400 }
            );
        }

        // Check for duplicate BoE number and item
        const existing = await db
            .select()
            .from(importsBoe)
            .where(sql`${importsBoe.boeNo} = ${boeNo} AND ${importsBoe.itemNo} = ${itemNo}`)
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, message: `BoE ${boeNo} item ${itemNo} already exists` },
                { status: 400 }
            );
        }

        // Insert the new BOE record
        const result = await db.insert(importsBoe).values({
            boeNo: boeNo.trim(),
            boeDate: parsedDate,
            officeCode: officeCode?.trim() || null,
            itemNo: itemNo.trim(),
            hsCode: hsCode?.trim() || null,
            description: description?.trim() || null,
            assessableValue: assessableValue ? assessableValue.toString() : null,
            baseVat: baseVat ? baseVat.toString() : null,
            sd: sd ? sd.toString() : null,
            vat: vat ? vat.toString() : null,
            at: at ? at.toString() : null,
            qty: qty ? qty.toString() : null,
            unit: unit?.trim() || null,
        }).returning({ id: importsBoe.id });

        return NextResponse.json({
            success: true,
            message: `BoE record ${boeNo} item ${itemNo} saved successfully`,
            id: result[0].id
        });

    } catch (error) {
        console.error('Error saving BOE record:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to save BOE record' },
            { status: 500 }
        );
    }
}