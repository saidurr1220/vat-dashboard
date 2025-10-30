import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { productGroupMembers, auditLog } from '@/db/footwear-schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);
        const { productId, isPrimary } = await request.json();

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        // Check if product is already in another group
        const existingMembership = await db
            .select()
            .from(productGroupMembers)
            .where(eq(productGroupMembers.productId, productId))
            .limit(1);

        if (existingMembership.length > 0) {
            return NextResponse.json(
                { error: 'Product is already in another group' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            // If this is set as primary, remove primary from others
            if (isPrimary) {
                await tx
                    .update(productGroupMembers)
                    .set({ isPrimary: false })
                    .where(eq(productGroupMembers.groupId, groupId));
            }

            // Add the product to the group
            const newMember = await tx
                .insert(productGroupMembers)
                .values({
                    groupId,
                    productId,
                    isPrimary: isPrimary || false,
                })
                .returning();

            // Log the action
            await tx.insert(auditLog).values({
                action: 'add_member',
                entityType: 'product_group',
                entityId: groupId,
                newValues: JSON.stringify({ productId, isPrimary }),
                userId: 'admin',
                notes: `Added product ${productId} to group ${groupId}`
            });

            return newMember[0];
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding group member:', error);
        return NextResponse.json(
            { error: 'Failed to add product to group' },
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
        const { searchParams } = new URL(request.url);
        const productId = parseInt(searchParams.get('productId') || '0');

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            // Check if this is the primary member
            const member = await tx
                .select()
                .from(productGroupMembers)
                .where(
                    and(
                        eq(productGroupMembers.groupId, groupId),
                        eq(productGroupMembers.productId, productId)
                    )
                )
                .limit(1);

            if (member.length === 0) {
                throw new Error('Product not found in group');
            }

            // Remove the member
            await tx
                .delete(productGroupMembers)
                .where(
                    and(
                        eq(productGroupMembers.groupId, groupId),
                        eq(productGroupMembers.productId, productId)
                    )
                );

            // If this was the primary member, set another as primary
            if (member[0].isPrimary) {
                const remainingMembers = await tx
                    .select()
                    .from(productGroupMembers)
                    .where(eq(productGroupMembers.groupId, groupId))
                    .limit(1);

                if (remainingMembers.length > 0) {
                    await tx
                        .update(productGroupMembers)
                        .set({ isPrimary: true })
                        .where(eq(productGroupMembers.id, remainingMembers[0].id));
                }
            }

            // Log the action
            await tx.insert(auditLog).values({
                action: 'remove_member',
                entityType: 'product_group',
                entityId: groupId,
                oldValues: JSON.stringify(member[0]),
                userId: 'admin',
                notes: `Removed product ${productId} from group ${groupId}`
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing group member:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to remove product from group' },
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
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            // Remove primary from all members in the group
            await tx
                .update(productGroupMembers)
                .set({ isPrimary: false })
                .where(eq(productGroupMembers.groupId, groupId));

            // Set the specified product as primary
            const updated = await tx
                .update(productGroupMembers)
                .set({ isPrimary: true })
                .where(
                    and(
                        eq(productGroupMembers.groupId, groupId),
                        eq(productGroupMembers.productId, productId)
                    )
                )
                .returning();

            if (updated.length === 0) {
                throw new Error('Product not found in group');
            }

            // Log the action
            await tx.insert(auditLog).values({
                action: 'set_primary',
                entityType: 'product_group',
                entityId: groupId,
                newValues: JSON.stringify({ productId }),
                userId: 'admin',
                notes: `Set product ${productId} as primary in group ${groupId}`
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error setting primary member:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to set primary member' },
            { status: 500 }
        );
    }
}