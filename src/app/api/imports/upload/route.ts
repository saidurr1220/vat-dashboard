import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { importsBoe } from '@/db/schema';
import { parse } from 'csv-parse/sync';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            return NextResponse.json(
                { success: false, message: 'Please upload a CSV file' },
                { status: 400 }
            );
        }

        // Read file content
        const fileContent = await file.text();

        // Parse CSV
        let records;
        try {
            records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        } catch (parseError) {
            return NextResponse.json(
                { success: false, message: 'Invalid CSV format' },
                { status: 400 }
            );
        }

        if (records.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No data found in CSV file' },
                { status: 400 }
            );
        }

        // Validate required columns
        const requiredColumns = [
            'boe_no', 'boe_date', 'office_code', 'item_no', 'hs_code',
            'description', 'assessable_value', 'base_vat', 'sd', 'vat', 'at', 'qty', 'unit'
        ];

        const firstRecord = records[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRecord));

        if (missingColumns.length > 0) {
            return NextResponse.json({
                success: false,
                message: `Missing required columns: ${missingColumns.join(', ')}`,
            }, { status: 400 });
        }

        // Process and insert records
        let imported = 0;
        const errors: string[] = [];

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNum = i + 2; // +2 because CSV is 1-indexed and has header row

            try {
                // Validate and parse data
                const boeDate = new Date(record.boe_date);
                if (isNaN(boeDate.getTime())) {
                    errors.push(`Row ${rowNum}: Invalid date format`);
                    continue;
                }

                // Check for duplicate BoE number and item
                const existing = await db
                    .select()
                    .from(importsBoe)
                    .where(sql`${importsBoe.boeNo} = ${record.boe_no} AND ${importsBoe.itemNo} = ${record.item_no}`)
                    .limit(1);

                if (existing.length > 0) {
                    errors.push(`Row ${rowNum}: Duplicate BoE ${record.boe_no} item ${record.item_no}`);
                    continue;
                }

                // Insert record
                await db.insert(importsBoe).values({
                    boeNo: record.boe_no,
                    boeDate: boeDate,
                    officeCode: record.office_code || null,
                    itemNo: record.item_no,
                    hsCode: record.hs_code || null,
                    description: record.description || null,
                    assessableValue: record.assessable_value ? record.assessable_value : null,
                    baseVat: record.base_vat ? record.base_vat : null,
                    sd: record.sd ? record.sd : null,
                    vat: record.vat ? record.vat : null,
                    at: record.at ? record.at : null,
                    qty: record.qty ? record.qty : null,
                    unit: record.unit || null,
                });

                imported++;
            } catch (error) {
                console.error(`Error processing row ${rowNum}:`, error);
                errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Processing error'}`);
            }
        }

        const response = {
            success: imported > 0,
            message: imported > 0
                ? `Successfully imported ${imported} records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
                : 'No records were imported',
            imported,
            errors: errors.slice(0, 10), // Limit errors to first 10
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process upload' },
            { status: 500 }
        );
    }
}