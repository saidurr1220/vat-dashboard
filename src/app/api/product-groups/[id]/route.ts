import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { productGroups, productGroupMembers, auditLog } from '@/db/footwear-schema';
import { products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);

        // Get group details with members
        const groupDetails = await db
            .select({
                id: productGroups.id,
                groupName: productGroups.groupName,
                description: productGroups.description,
                createdAt: productGroups.createdAt,
                productId: products.id,
                productName: products.name,
                productCategory: products.category,
                productUnit: products.unit,
                isPrimary: productGroupMembers.isPrimary,
                stockOnHand: sql<number>`COALESCE(SUM(bl.closing_pairs), 0)`,
                declaredPrice: sql<number>`AVG(bl.declared_unit_value)`,
            })
            .from(productGroups)
            .leftJoin(productGroupMembers, eq(productGroups.id, productGroupMembers.groupId))
            .leftJoin(products, eq(productGroupMembers.productId, products.id))
            .leftJoin(sql`boe_lots bl`, sql`bl.product_id = ${products.id}`)
            .where(eq(productGroups.id, groupId))
            .groupBy(
                productGroups.id,
                productGroups.groupName,
                productGroups.description,
                productGroups.createdAt,
                products.id,
                products.name,
                products.category,
                products.unit,
                productGroupMembers.isPrimary
            );

        if (groupDetails.length === 0) {
            return NextResponse.json(
                { error: 'Product group not found' },
                { status: 404 }
            );
        }

        // Structure the response
        const group = {
            id: groupDetails[0].id,
            groupName: groupDetails[0].groupName,
            description: groupDetails[0].description,
            createdAt: groupDetails[0].createdAt,
            members: groupDetails
                .filter(item => item.productId)
                .map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    category: item.productCategory,
                    unit: item.productUnit,
                    isPrimary: item.isPrimary,
                    stockOnHand: Number(item.stockOnHand),
                    declaredPrice: Number(item.declaredPrice || 0),
                })),
            totalStock: groupDetails.reduce((sum, item) => sum + Number(item.stockOnHand || 0), 0)
        };

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error fetching product group:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product group' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);
        const { groupName, description } = await request.json();

        if (!groupName?.trim()) {
            return NextResponse.json(
                { error: 'Group name is required' },
                { status: 400 }
            );
        }

        const updatedGroup = await db
            .update(productGroups)
            .set({
                groupName: groupName.trim(),
                description: description?.trim() || null,
                updatedAt: new Date(),
            })
            .where(eq(productGroups.id, groupId))
            .returning();

        if (updatedGroup.length === 0) {
            return NextResponse.json(
                { error: 'Product group not found' },
                { status: 404 }
            );
        }

        // Log the action
        await db.insert(auditLog).values({
            action: 'update_group',
            entityType: 'product_group',
            entityId: groupId,
            newValues: JSON.stringify({ groupName, description }),
            userId: 'admin',
            notes: `Updated group "${groupName}"`
        });

        return NextResponse.json(updatedGroup[0]);
    } catch (error) {
        console.error('Error updating product group:', error);
        return NextResponse.json(
            { error: 'Failed to update product group' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);

        await db.transaction(async (tx) => {
            // Get group info for logging
            const group = await tx
                .select()
                .from(productGroups)
                .where(eq(productGroups.id, groupId))
                .limit(1);

            if (group.length === 0) {
                throw new Error('Product group not found');
            }

            // Delete group members first (cascade should handle this, but being explicit)
            await tx
                .delete(productGroupMembers)
                .where(eq(productGroupMembers.groupId, groupId));

            // Delete the group
            await tx
                .delete(productGroups)
                .where(eq(productGroups.id, groupId));

            // Log the action
            await tx.insert(auditLog).values({
                action: 'delete_group',
                entityType: 'product_group',
                entityId: groupId,
                oldValues: JSON.stringify(group[0]),
                userId: 'admin',
                notes: `Deleted group "${group[0].groupName}"`
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product group:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete product group' },
            { status: 500 }
        );
    }
}