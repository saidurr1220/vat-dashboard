import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products, salesLines, stockLedger } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const summary = searchParams.get('summary') === 'true';

        // Get products with stock information
        const result = await db.execute(sql`
            SELECT 
                p.id,
                p.name,
                p.sku,
                p.hs_code as "hsCode",
                p.unit,
                p.sell_ex_vat as "sellExVat",
                p.cost_ex_vat as "costExVat",
                p.category,
                p.tests_per_kit as "testsPerKit",
                p.stock_on_hand as "stockOnHand",
                p.created_at as "createdAt",
                p.updated_at as "updatedAt"
            FROM products p
            ORDER BY p.id
        `);

        // For summary requests, skip expensive calculations
        if (summary) {
            const productsWithStock = result.rows.map((product: any) => ({
                id: product.id,
                name: product.name,
                sku: product.sku,
                hsCode: product.hsCode,
                unit: product.unit,
                costExVat: Number(product.costExVat || 0),
                sellExVat: Number(product.sellExVat || 0),
                category: product.category || 'General',
                testsPerKit: product.testsPerKit,
                stockOnHand: Number(product.stockOnHand || 0),
                totalSold: 0, // Skip expensive calculation for summary
                stockValue: Number(product.stockOnHand || 0) * Number(product.costExVat || 0),
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            }));

            const response = NextResponse.json(productsWithStock);
            response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
            return response;
        }

        // Get all sales data in one query for better performance
        let salesData: { [key: number]: number } = {};
        try {
            const salesResult = await db.execute(sql`
                SELECT 
                    product_id,
                    COALESCE(SUM(CAST(qty AS NUMERIC)), 0) as total_sold
                FROM sales_lines 
                GROUP BY product_id
            `);

            salesResult.rows.forEach((row: any) => {
                salesData[Number(row.product_id)] = Number(row.total_sold || 0);
            });
        } catch (error) {
            console.log('Sales calculation failed:', error);
        }

        // Calculate stock values and get sales data for full requests
        const productsWithStock = result.rows.map((product: any) => {
            const costExVat = Number(product.costExVat || 0);
            const sellExVat = Number(product.sellExVat || 0);
            const stockOnHand = Number(product.stockOnHand || 0);
            const totalSold = salesData[product.id] || 0;

            return {
                id: product.id,
                name: product.name,
                sku: product.sku,
                hsCode: product.hsCode,
                unit: product.unit,
                costExVat,
                sellExVat,
                category: product.category || 'General',
                testsPerKit: product.testsPerKit,
                stockOnHand,
                totalSold,
                stockValue: stockOnHand * costExVat,
                stockValueVat: stockOnHand * costExVat * 0.15,
                stockValueIncVat: stockOnHand * costExVat * 1.15,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            };
        });

        const response = NextResponse.json(productsWithStock);
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return response;
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export const POST = requireAdmin(async (request: NextRequest) => {
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
                sku: sku?.trim() || null,
                hsCode: hsCode?.trim() || null,
                category: category || null,
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
});