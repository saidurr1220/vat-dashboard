import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { products, salesLines, stockLedger } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Use raw SQL to get products with current stock (including footwear from boe_lots)
        const result = await db.execute(sql`
            SELECT 
                p.id,
                p.name,
                p.unit,
                p.sell_ex_vat as "sellExVat",
                p.cost_ex_vat as "costExVat",
                p.category,
                CASE 
                    WHEN p.category = 'Footwear' THEN 
                        COALESCE((
                            SELECT SUM(bl.closing_pairs)
                            FROM boe_lots bl 
                            WHERE bl.product_id = p.id
                        ), 0)
                    ELSE 
                        COALESCE((
                            SELECT SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric)
                            FROM stock_ledger sl 
                            WHERE sl.product_id = p.id
                        ), 0)
                END as "stockOnHand"
            FROM products p
            ORDER BY p.id
        `);

        // Calculate stock values
        const productsWithStock = result.rows.map((product: any) => {
            const stockOnHand = Number(product.stockOnHand || 0);
            const costExVat = Number(product.costExVat || 0);
            const sellExVat = Number(product.sellExVat || 0);

            return {
                ...product,
                stockOnHand,
                stockValue: stockOnHand * costExVat,
                stockValueVat: stockOnHand * costExVat * 0.15,
                stockValueIncVat: stockOnHand * costExVat * 1.15,
            };
        });

        return NextResponse.json(productsWithStock);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
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
}