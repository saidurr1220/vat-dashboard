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

        // Check for different CSV formats
        const firstRecord = records[0];

        // Normalize column names (handle spaces and case)
        const normalizedRecord: any = {};
        Object.keys(firstRecord).forEach(key => {
            const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
            normalizedRecord[normalizedKey] = firstRecord[key];
        });

        const hasStandardFormat = 'assessable_value' in normalizedRecord && 'vat' in normalizedRecord && 'at' in normalizedRecord;
        const hasEnhancedFormat = 'assessable_value' in normalizedRecord && 'cd_rate' in normalizedRecord;
        const hasSimpleFormat = 'base_value' in normalizedRecord && 'sd_value' in normalizedRecord;
        const hasOldSimpleFormat = 'base_value' in normalizedRecord && 'declared_unit_value' in normalizedRecord;

        // Validate required columns based on format
        let requiredColumns: string[];
        if (hasEnhancedFormat) {
            requiredColumns = [
                'boe_number', 'boe_date_(yyyy-mm-dd)', 'item_no', 'hs_code', 'description',
                'assessable_value', 'cd_rate', 'rd_rate', 'sd_rate', 'vat_rate', 'ait_rate', 'at_rate', 'unit', 'quantity'
            ];
        } else if (hasSimpleFormat) {
            requiredColumns = [
                'boe_number', 'boe_date_(yyyy-mm-dd)', 'item_no', 'hs_code', 'description',
                'base_value', 'sd_value', 'unit', 'quantity'
            ];
        } else if (hasOldSimpleFormat) {
            requiredColumns = [
                'boe_number', 'boe_date_(yyyy-mm-dd)', 'item_no', 'hs_code', 'description',
                'base_value', 'sd', 'unit', 'pairs_final', 'declared_unit_value'
            ];
        } else {
            // Standard format - matches our template
            requiredColumns = [
                'boe_number', 'boe_date_(yyyy-mm-dd)', 'item_no', 'hs_code',
                'description', 'assessable_value', 'base_vat', 'sd', 'vat', 'at', 'quantity', 'unit'
            ];
        }

        const missingColumns = requiredColumns.filter(col => !(col in normalizedRecord));

        if (missingColumns.length > 0) {
            const formatType = hasEnhancedFormat ? 'Enhanced (BD Customs)' : hasSimpleFormat ? 'Simple (Base+SD)' : hasOldSimpleFormat ? 'Old Simple' : 'Standard';
            return NextResponse.json({
                success: false,
                message: `Missing required columns: ${missingColumns.join(', ')}. Format detected: ${formatType}`,
            }, { status: 400 });
        }

        // Process and insert records
        let imported = 0;
        const errors: string[] = [];

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNum = i + 2; // +2 because CSV is 1-indexed and has header row

            // Normalize column names
            const normalizedRecord: any = {};
            Object.keys(record).forEach(key => {
                const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
                normalizedRecord[normalizedKey] = record[key];
            });

            try {
                // Get BOE number and date with fallback column names
                const boeNo = normalizedRecord.boe_number || normalizedRecord.boe_no || '';
                const boeDateStr = normalizedRecord['boe_date_(yyyy-mm-dd)'] || normalizedRecord.boe_date || '';

                const boeDate = new Date(boeDateStr);
                if (isNaN(boeDate.getTime())) {
                    errors.push(`Row ${rowNum}: Invalid date format`);
                    continue;
                }

                const itemNo = normalizedRecord.item_no || '';

                // Check for duplicate BoE number and item combination only
                const existing = await db
                    .select({ id: importsBoe.id })
                    .from(importsBoe)
                    .where(sql`${importsBoe.boeNo} = ${boeNo} AND ${importsBoe.itemNo} = ${itemNo}`)
                    .limit(1);

                if (existing.length > 0) {
                    errors.push(`Row ${rowNum}: Duplicate BoE ${boeNo} item ${itemNo} already exists`);
                    continue;
                }

                // Process data based on format
                let processedData;

                if (hasEnhancedFormat) {
                    // Enhanced format - Bangladesh customs calculation
                    const assessableValue = parseFloat(record.assessable_value) || 0;
                    const cdRate = parseFloat(record.cd_rate) || 25; // Default 25% CD
                    const rdRate = parseFloat(record.rd_rate) || 3;  // Default 3% RD
                    const sdRate = parseFloat(record.sd_rate) || 45; // Default 45% SD
                    const vatRate = parseFloat(record.vat_rate) || 15; // Default 15% VAT
                    const aitRate = parseFloat(record.ait_rate) || 5;  // Default 5% AIT
                    const atRate = parseFloat(record.at_rate) || 0;    // Default 0% AT
                    const qty = parseFloat(record.qty) || 0;

                    // Bangladesh Customs Calculation:
                    // 1. CD = Assessable Value × CD Rate%
                    const customsDuty = assessableValue * (cdRate / 100);

                    // 2. RD = Assessable Value × RD Rate%
                    const regulatoryDuty = assessableValue * (rdRate / 100);

                    // 3. Base for SD = Assessable Value + CD + RD
                    const sdBase = assessableValue + customsDuty + regulatoryDuty;

                    // 4. SD = SD Base × SD Rate%
                    const supplementaryDuty = sdBase * (sdRate / 100);

                    // 5. Base for VAT = SD Base + SD
                    const vatBase = sdBase + supplementaryDuty;

                    // 6. VAT = VAT Base × VAT Rate%
                    const vat = vatBase * (vatRate / 100);

                    // 7. AIT = Assessable Value × AIT Rate%
                    const ait = assessableValue * (aitRate / 100);

                    // 8. AT = Assessable Value × AT Rate%
                    const at = assessableValue * (atRate / 100);

                    processedData = {
                        boeNo: record.boe_no,
                        boeDate: boeDate,
                        officeCode: record.office_code || null,
                        itemNo: record.item_no,
                        hsCode: record.hs_code || null,
                        description: record.description || null,
                        assessableValue: assessableValue,
                        baseVat: customsDuty + regulatoryDuty, // Store CD+RD in baseVat field
                        sd: supplementaryDuty,
                        vat: vat,
                        at: at + ait, // Combine AT and AIT
                        qty: qty,
                        unit: record.unit || null,
                        // notes: `BD Customs: CD=${cdRate}%, RD=${rdRate}%, SD=${sdRate}%, VAT=${vatRate}%, AIT=${aitRate}%, AT=${atRate}%`
                    };
                } else if (hasSimpleFormat) {
                    // Simple format - আপনার BoE format (Base + SD)
                    const baseValue = parseFloat(record.base_value) || 0;
                    const sdValue = parseFloat(record.sd_value) || 0;
                    const qty = parseFloat(record.qty) || 0;

                    console.log(`Row ${rowNum}: base_value=${record.base_value}, sd_value=${record.sd_value}, qty=${record.qty}`);
                    console.log(`Row ${rowNum}: parsed - baseValue=${baseValue}, sdValue=${sdValue}, qty=${qty}`);

                    // Validate numbers
                    if (isNaN(baseValue) || isNaN(sdValue) || isNaN(qty)) {
                        errors.push(`Row ${rowNum}: Invalid numeric values - base_value, sd_value, or qty`);
                        continue;
                    }

                    // আপনার calculation with proper rounding:
                    // AT = Base এর 5%
                    const at = Math.round((baseValue * 0.05 + Number.EPSILON) * 100) / 100;

                    // VAT = Base এর 15%
                    const vat = Math.round((baseValue * 0.15 + Number.EPSILON) * 100) / 100;

                    // Assessable Value = Base + SD
                    const assessableValue = Math.round((baseValue + sdValue + Number.EPSILON) * 100) / 100;

                    console.log(`Row ${rowNum}: calculated - AT=${at}, VAT=${vat}, Assessable=${assessableValue}`);

                    processedData = {
                        boeNo: record.boe_no,
                        boeDate: boeDate,
                        officeCode: record.office_code || null,
                        itemNo: record.item_no,
                        hsCode: record.hs_code || null,
                        description: record.description || null,
                        assessableValue: assessableValue,
                        baseVat: baseValue, // Store base value
                        sd: sdValue,
                        vat: vat,
                        at: at,
                        qty: qty,
                        unit: record.unit || null,
                        // notes: `Simple BoE: AT=Base×5% (${at.toLocaleString()}), VAT=Base×15% (${vat.toLocaleString()})`
                    };
                } else if (hasOldSimpleFormat) {
                    // Old simple format - basic calculation
                    const baseValue = parseFloat(record.base_value) || 0;
                    const sd = parseFloat(record.sd) || 0;
                    const atRate = parseFloat(record.at_rate) || 3; // Default 3% AT
                    const qty = parseFloat(record.pairs_final) || 0;

                    // Calculate assessable value (base + sd)
                    const assessableValue = baseValue + sd;

                    // Calculate VAT: 15% of (base + sd)
                    const vat = assessableValue * 0.15;

                    // Calculate AT: specified rate % of assessable value
                    const at = assessableValue * (atRate / 100);

                    processedData = {
                        boeNo: record.boe_no,
                        boeDate: boeDate,
                        officeCode: record.office_code || null,
                        itemNo: record.item_no,
                        hsCode: record.hs_code || null,
                        description: record.description || null,
                        assessableValue: assessableValue,
                        baseVat: baseValue, // Store base value in baseVat field
                        sd: sd,
                        vat: vat,
                        at: at,
                        qty: qty,
                        unit: record.unit || null,
                        // notes: `Old simple calc: AT Rate ${atRate}%, Declared Unit Value: ${record.declared_unit_value}`
                    };
                } else {
                    // Standard format - use provided values
                    processedData = {
                        boeNo: boeNo,
                        boeDate: boeDate,
                        officeCode: normalizedRecord.office_code || null,
                        itemNo: itemNo,
                        hsCode: normalizedRecord.hs_code || null,
                        description: normalizedRecord.description || null,
                        assessableValue: normalizedRecord.assessable_value ? parseFloat(normalizedRecord.assessable_value) : null,
                        baseVat: normalizedRecord.base_vat ? parseFloat(normalizedRecord.base_vat) : null,
                        sd: normalizedRecord.sd ? parseFloat(normalizedRecord.sd) : null,
                        vat: normalizedRecord.vat ? parseFloat(normalizedRecord.vat) : null,
                        at: normalizedRecord.at ? parseFloat(normalizedRecord.at) : null,
                        qty: normalizedRecord.quantity || normalizedRecord.qty ? parseFloat(normalizedRecord.quantity || normalizedRecord.qty) : null,
                        unit: normalizedRecord.unit || null,
                    };
                }

                // Insert record with explicit fields only
                await db.insert(importsBoe).values({
                    boeNo: processedData.boeNo,
                    boeDate: processedData.boeDate,
                    officeCode: processedData.officeCode,
                    itemNo: processedData.itemNo,
                    hsCode: processedData.hsCode,
                    description: processedData.description,
                    assessableValue: processedData.assessableValue?.toString() || '0',
                    baseVat: processedData.baseVat?.toString() || '0',
                    sd: processedData.sd?.toString() || '0',
                    vat: processedData.vat?.toString() || '0',
                    at: processedData.at?.toString() || '0',
                    qty: processedData.qty?.toString() || '0',
                    unit: processedData.unit,
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