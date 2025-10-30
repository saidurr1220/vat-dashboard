import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = parseInt(id);

        const product = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        if (product.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(product[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
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
        const productId = parseInt(id);
        const body = await request.json();

        const {
            name,
            sku,
            hsCode,
            category,
            unit,
            costExVat,
            sellExVat,
            testsPerKit
        } = body;

        if (!name?.trim() || !unit?.trim()) {
            return NextResponse.json(
                { error: 'Name and unit are required' },
                { status: 400 }
            );
        }

        const updatedProduct = await db
            .update(products)
            .set({
                name: name.trim(),
                sku: sku?.trim() || null,
                hsCode: hsCode?.trim() || null,
                category: category || null,
                unit: unit.trim(),
                costExVat: costExVat ? costExVat.toString() : null,
                sellExVat: sellExVat ? sellExVat.toString() : null,
                testsPerKit: testsPerKit || null,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning();

        if (updatedProduct.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedProduct[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: 'Failed to update product' },
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
        const productId = parseInt(id);

        const deletedProduct = await db
            .delete(products)
            .where(eq(products.id, productId))
            .returning();

        if (deletedProduct.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}