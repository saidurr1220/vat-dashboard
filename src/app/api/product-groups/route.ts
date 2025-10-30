import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products } from '@/db/schema';
import { productGroups, productGroupMembers, auditLog } from '@/db/footwear-schema';
import { sql, eq, inArray } from 'drizzle-orm';

export async function GET() {
    try {
        // Get all product groups with their members
        const result = await db.execute(sql`
            SELECT 
                pg.id as group_id,
                pg.group_name,
                pg.description,
                pg.created_at,
                json_agg(
                    json_build_object(
                        'product_id', p.id,
                        'product_name', p.name,
                        'is_primary', pgm.is_primary,
                        'category', p.category,
                        'cost_ex_vat', p.cost_ex_vat,
                        'sell_ex_vat', p.sell_ex_vat
                    ) ORDER BY pgm.is_primary DESC, p.name
                ) as members
            FROM product_groups pg
            LEFT JOIN product_group_members pgm ON pg.id = pgm.group_id
            LEFT JOIN products p ON pgm.product_id = p.id
            WHERE p.category = 'Footwear'
            GROUP BY pg.id, pg.group_name, pg.description, pg.created_at
            ORDER BY pg.group_name
        `);

        return NextResponse.json({
            success: true,
            groups: result.rows
        });

    } catch (error) {
        console.error('Error fetching product groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product groups' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { groupName, description, productIds, primaryProductId } = body;

        if (!groupName || !productIds || productIds.length < 2) {
            return NextResponse.json(
                { error: 'Group name and at least 2 products are required' },
                { status: 400 }
            );
        }

        // Verify all products are footwear and exist
        const productsToGroup = await db
            .select()
            .from(products)
            .where(
                sql`${products.id} = ANY(${productIds}) AND ${products.category} = 'Footwear'`
            );

        if (productsToGroup.length !== productIds.length) {
            return NextResponse.json(
                { error: 'Some products not found or not footwear category' },
                { status: 400 }
            );
        }

        // Check if any products are already in groups
        const existingMembers = await db.execute(sql`
            SELECT product_id FROM product_group_members 
            WHERE product_id = ANY(${productIds})
        `);

        if (existingMembers.rows.length > 0) {
            return NextResponse.json(
                { error: 'Some products are already in groups. Ungroup them first.' },
                { status: 400 }
            );
        }

        let groupId: number;

        await db.transaction(async (tx) => {
            // Create the group
            const newGroup = await tx
                .insert(productGroups)
                .values({
                    groupName,
                    description: description || null
                })
                .returning();

            groupId = newGroup[0].id;

            // Add members
            const memberData = productIds.map((productId: number) => ({
                groupId,
                productId,
                isPrimary: productId === primaryProductId
            }));

            await tx.insert(productGroupMembers).values(memberData);

            // Log the action
            await tx.insert(auditLog).values({
                action: 'create_group',
                entityType: 'product_group',
                entityId: groupId,
                newValues: JSON.stringify({ groupName, productIds, primaryProductId }),
                userId: 'admin',
                notes: `Created group "${groupName}" with ${productIds.length} products`
            });
        });

        return NextResponse.json({
            success: true,
            message: `Product group "${groupName}" created successfully`,
            groupId
        });

    } catch (error) {
        console.error('Error creating product group:', error);
        return NextResponse.json(
            { error: 'Failed to create product group' },
            { status: 500 }
        );
    }
}