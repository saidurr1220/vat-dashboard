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

        console.log('POST request received:', body);

        // Validate required fields
        if (!boeNo || !boeDate || !itemNo) {
            console.log('Validation failed: missing required fields');
            return NextResponse.json(
                { error: 'BoE Number, Date, and Item Number are required' },
                { status: 400 }
            );
        }

        // Validate date format
        const parsedDate = new Date(boeDate);
        if (isNaN(parsedDate.getTime())) {
            console.log('Validation failed: invalid date format');
            return NextResponse.json(
                { error: 'Invalid date format' },
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
            console.log('Duplicate found:', boeNo, itemNo);
            return NextResponse.json(
                { error: `BoE ${boeNo} item ${itemNo} already exists` },
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

        console.log('Insert successful:', result);

        return NextResponse.json({
            success: true,
            message: `BoE record ${boeNo} item ${itemNo} saved successfully`,
            id: result[0].id
        });

    } catch (error) {
        console.error('Error saving BOE record:', error);
        return NextResponse.json(
            { error: 'Failed to save BOE record', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}