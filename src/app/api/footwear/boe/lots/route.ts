import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get all BoE lots with product information
        const result = await db.execute(sql`
            SELECT 
                bl.id,
                bl.lot_id as "lotId",
                bl.boe_number as "boeNumber",
                bl.boe_item_no as "boeItemNo",
                bl.boe_date as "boeDate",
                bl.description,
                bl.hs_code as "hsCode",
                bl.base_value as "baseValue",
                bl.sd_value as "sdValue",
                bl.unit_purchase_cost as "unitPurchaseCost",
                bl.category,
                bl.month,
                bl.carton_size as "cartonSize",
                bl.opening_pairs as "openingPairs",
                bl.closing_pairs as "closingPairs",
                bl.declared_unit_value as "declaredUnitValue",
                p.name as "productName"
            FROM boe_lots bl
            LEFT JOIN products p ON bl.product_id = p.id
            ORDER BY bl.boe_date DESC, bl.boe_number DESC, bl.boe_item_no ASC
        `);

        // Calculate totals
        const totals = {
            totalLots: result.rows.length,
            totalOpeningPairs: result.rows.reduce((sum, lot) => sum + Number(lot.openingPairs || 0), 0),
            totalClosingPairs: result.rows.reduce((sum, lot) => sum + Number(lot.closingPairs || 0), 0),
            totalBaseValue: result.rows.reduce((sum, lot) => sum + Number(lot.baseValue || 0), 0),
        };

        return NextResponse.json({
            lots: result.rows,
            totals
        });
    } catch (error) {
        console.error('Error fetching BoE lots:', error);
        return NextResponse.json(
            { error: 'Failed to fetch BoE lots' },
            { status: 500 }
        );
    }
}