import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const confirm = searchParams.get('confirm');

        if (confirm !== 'true') {
            return NextResponse.json(
                { error: 'Confirmation required. Add ?confirm=true to proceed with reset.' },
                { status: 400 }
            );
        }

        // Start transaction for atomic reset
        await db.transaction(async (tx) => {
            // 1. Delete sale line allocations for footwear products
            await tx.execute(sql`
                DELETE FROM sale_line_allocations 
                WHERE boe_lot_id IN (
                    SELECT id FROM boe_lots 
                    WHERE category IN ('mens', 'ladies', 'boys', 'baby')
                )
            `);

            // 2. Delete sales lines for footwear products
            await tx.execute(sql`
                DELETE FROM sales_lines 
                WHERE product_id IN (
                    SELECT id FROM products 
                    WHERE category = 'Footwear'
                )
            `);

            // 3. Delete sales that have no lines left
            await tx.execute(sql`
                DELETE FROM sales 
                WHERE id NOT IN (SELECT DISTINCT sale_id FROM sales_lines)
            `);

            // 4. Delete BoE lots for footwear
            await tx.execute(sql`
                DELETE FROM boe_lots 
                WHERE category IN ('mens', 'ladies', 'boys', 'baby')
            `);

            // 5. Delete stock ledger entries for footwear products
            await tx.execute(sql`
                DELETE FROM stock_ledger 
                WHERE product_id IN (
                    SELECT id FROM products 
                    WHERE category = 'Footwear'
                )
            `);

            // 6. Delete VAT summary entries (optional - keep if needed)
            // await tx.execute(sql`DELETE FROM vat_summary`);

            // 7. Delete treasury challans (optional - keep if needed)
            // await tx.execute(sql`DELETE FROM treasury_challans`);

            // 8. Reset product group memberships for footwear
            await tx.execute(sql`
                DELETE FROM product_group_members 
                WHERE product_id IN (
                    SELECT id FROM products 
                    WHERE category = 'Footwear'
                )
            `);

            // 9. Delete empty product groups
            await tx.execute(sql`
                DELETE FROM product_groups 
                WHERE id NOT IN (SELECT DISTINCT group_id FROM product_group_members)
            `);

            // 10. Reset price memory for footwear
            await tx.execute(sql`
                DELETE FROM price_memory 
                WHERE product_id IN (
                    SELECT id FROM products 
                    WHERE category = 'Footwear'
                )
            `);

            // 11. Delete product aliases for footwear
            await tx.execute(sql`
                DELETE FROM product_aliases 
                WHERE product_id IN (
                    SELECT id FROM products 
                    WHERE category = 'Footwear'
                )
            `);

            // 12. Delete imports_boe entries for footwear
            await tx.execute(sql`
                DELETE FROM imports_boe 
                WHERE hs_code LIKE '6405%' OR description ILIKE '%footwear%' OR description ILIKE '%keds%' OR description ILIKE '%sandel%'
            `);

            // 13. Delete footwear products
            await tx.execute(sql`
                DELETE FROM products 
                WHERE category = 'Footwear'
            `);

            // 14. Log the reset action
            await tx.execute(sql`
                INSERT INTO audit_log (action, entity_type, notes, user_id)
                VALUES ('reset', 'footwear_system', 'Hard reset of footwear data including products and BoE entries', 'admin')
            `);
        });

        return NextResponse.json({
            success: true,
            message: 'Footwear system reset completed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error resetting footwear system:', error);
        return NextResponse.json(
            { error: 'Failed to reset footwear system' },
            { status: 500 }
        );
    }
}