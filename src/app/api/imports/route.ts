import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { importsBoe } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const imports = await db.execute(sql`
            SELECT 
                id,
                boe_no as "boeNo",
                boe_date as "boeDate",
                item_no as "itemNo",
                hs_code as "hsCode",
                description,
                assessable_value as "assessableValue",
                base_vat as "baseVat",
                sd,
                vat,
                at,
                qty,
                unit,
                weight_net as "weightNet",
                weight_gross as "weightGross",
                notes,
                created_at as "createdAt"
            FROM imports_boe
            ORDER BY boe_date DESC, boe_no DESC, item_no ASC
            LIMIT ${limit}
        `);

        return NextResponse.json(imports.rows);
    } catch (error) {
        console.error('Error fetching imports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch imports' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Handle both single import and bulk import
        const imports = Array.isArray(body) ? body : [body];

        const results = [];

        for (const importData of imports) {
            const {
                boeNo,
                boeDate,
                itemNo,
                hsCode,
                description,
                assessableValue,
                baseVat,
                sd,
                vat,
                at,
                qty,
                unit,
                weightNet,
                weightGross,
                notes
            } = importData;

            // Validate required fields
            if (!boeNo || !boeDate || !itemNo) {
                return NextResponse.json(
                    { error: 'Missing required fields: boeNo, boeDate, itemNo' },
                    { status: 400 }
                );
            }

            // Insert the import record using raw SQL
            const result = await db.execute(sql`
                INSERT INTO imports_boe (
                    boe_no, boe_date, item_no, hs_code, description,
                    assessable_value, sd, qty, unit, notes
                ) VALUES (
                    ${boeNo}, 
                    ${new Date(boeDate)}, 
                    ${itemNo}, 
                    ${hsCode || null}, 
                    ${description || null},
                    ${assessableValue || null}, 
                    ${sd || null}, 
                    ${qty || null}, 
                    ${unit || null},
                    ${notes || null}
                )
                ON CONFLICT (boe_no, item_no) 
                DO UPDATE SET
                    boe_date = EXCLUDED.boe_date,
                    hs_code = EXCLUDED.hs_code,
                    description = EXCLUDED.description,
                    assessable_value = EXCLUDED.assessable_value,
                    sd = EXCLUDED.sd,
                    qty = EXCLUDED.qty,
                    unit = EXCLUDED.unit,
                    notes = EXCLUDED.notes
                RETURNING id
            `);

            results.push(result.rows[0]);
        }

        return NextResponse.json({
            success: true,
            imported: results.length,
            message: `Successfully imported ${results.length} BoE entries`
        });
    } catch (error) {
        console.error('Error creating import:', error);
        return NextResponse.json(
            {
                error: 'Failed to create import',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}