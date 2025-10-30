import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products, salesLines, stockLedger } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get products with basic stock calculation (simplified for production)
        const result = await db.execute(sql`
            SELECT 
                p.id,
                p.name,
                p.description,
                p.unit,
                p.sell_ex_vat as "sellExVat",
                p.cost_ex_vat as "costExVat",
                p.category,
                p.created_at as "createdAt",
                p.updated_at as "updatedAt"
            FROM products p
            ORDER BY p.id
        `);

        // Calculate stock values with fallback for missing stock data
        const productsWithStock = result.rows.map((product: any) => {
            const costExVat = Number(product.sellExVat || product.costExVat || 0);
            const sellExVat = Number(product.sellExVat || product.costExVat || 0);

            // For now, set stock to 0 since we don't have stock_ledger data
            // This can be enhanced later when stock management is fully implemented
            const stockOnHand = 0;

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                unit: product.unit,
                costExVat,
                sellExVat,
                category: product.category || 'General',
                stockOnHand,
                stockValue: stockOnHand * costExVat,
                stockValueVat: stockOnHand * costExVat * 0.15,
                stockValueIncVat: stockOnHand * costExVat * 1.15,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            };
        });

        return NextResponse.json(productsWithStock);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
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

        const newProduct = await db
            .insert(products)
            .values({
                name: name.trim(),
                description: body.description?.trim() || null,
                category: category || 'General',
                unit: unit.trim(),
                costExVat: costExVat ? costExVat.toString() : null,
                sellExVat: sellExVat ? sellExVat.toString() : null,
                testsPerKit: testsPerKit || null,
            })
            .returning();

        return NextResponse.json(newProduct[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}