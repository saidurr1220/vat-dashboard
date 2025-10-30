import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const category = searchParams.get('category');

        let result;

        if (productId) {
            // Single product query
            result = await db.execute(sql`
                SELECT 
                    p.id,
                    p.name,
                    p.category,
                    p.unit,
                    p.sell_ex_vat as "sellExVat",
                    p.cost_ex_vat as "costExVat",
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
                    END as "stockOnHand",
                    CASE 
                        WHEN p.category = 'Footwear' THEN 
                            (
                                SELECT COUNT(*)
                                FROM boe_lots bl 
                                WHERE bl.product_id = p.id AND bl.closing_pairs > 0
                            )
                        ELSE 0
                    END as "activeLots",
                    COALESCE((
                        SELECT SUM(sl.qty::numeric)
                        FROM sales_lines sl
                        JOIN sales s ON sl.sale_id = s.id
                        WHERE sl.product_id = p.id
                    ), 0) as "totalSold"
                FROM products p
                WHERE p.id = ${parseInt(productId)}
            `);
        } else if (category) {
            // Category-specific query
            result = await db.execute(sql`
                SELECT 
                    p.id,
                    p.name,
                    p.category,
                    p.unit,
                    p.sell_ex_vat as "sellExVat",
                    p.cost_ex_vat as "costExVat",
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
                    END as "stockOnHand",
                    CASE 
                        WHEN p.category = 'Footwear' THEN 
                            (
                                SELECT COUNT(*)
                                FROM boe_lots bl 
                                WHERE bl.product_id = p.id AND bl.closing_pairs > 0
                            )
                        ELSE 0
                    END as "activeLots",
                    COALESCE((
                        SELECT SUM(sl.qty::numeric)
                        FROM sales_lines sl
                        JOIN sales s ON sl.sale_id = s.id
                        WHERE sl.product_id = p.id
                    ), 0) as "totalSold"
                FROM products p
                WHERE p.category = ${category}
                ORDER BY p.name
            `);
        } else {
            // All products query
            result = await db.execute(sql`
                SELECT 
                    p.id,
                    p.name,
                    p.category,
                    p.unit,
                    p.sell_ex_vat as "sellExVat",
                    p.cost_ex_vat as "costExVat",
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
                    END as "stockOnHand",
                    CASE 
                        WHEN p.category = 'Footwear' THEN 
                            (
                                SELECT COUNT(*)
                                FROM boe_lots bl 
                                WHERE bl.product_id = p.id AND bl.closing_pairs > 0
                            )
                        ELSE 0
                    END as "activeLots",
                    COALESCE((
                        SELECT SUM(sl.qty::numeric)
                        FROM sales_lines sl
                        JOIN sales s ON sl.sale_id = s.id
                        WHERE sl.product_id = p.id
                    ), 0) as "totalSold"
                FROM products p
                ORDER BY p.category, p.name
            `);
        }

        // If single product requested, return just that product
        if (productId) {
            const product = result.rows[0];
            if (!product) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            return NextResponse.json({
                ...product,
                stockOnHand: Number(product.stockOnHand || 0),
                activeLots: Number(product.activeLots || 0),
                totalSold: Number(product.totalSold || 0)
            });
        }

        // Return all products with totals
        const products = result.rows.map((product: any) => ({
            ...product,
            stockOnHand: Number(product.stockOnHand || 0),
            activeLots: Number(product.activeLots || 0),
            totalSold: Number(product.totalSold || 0)
        }));

        const totals = {
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + p.stockOnHand, 0),
            totalValue: products.reduce((sum, p) => sum + (p.stockOnHand * Number(p.costExVat || 0)), 0),
            footwearStock: products.filter(p => p.category === 'Footwear').reduce((sum, p) => sum + p.stockOnHand, 0),
            otherStock: products.filter(p => p.category !== 'Footwear').reduce((sum, p) => sum + p.stockOnHand, 0)
        };

        return NextResponse.json({
            products,
            totals
        });

    } catch (error) {
        console.error('Error in unified stock API:', error);
        return NextResponse.json(
            { error: 'Failed to get stock data' },
            { status: 500 }
        );
    }
}