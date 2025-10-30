import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get footwear products summary
        const result = await db.execute(sql`
      SELECT 
        COUNT(*) as "productCount",
        COALESCE(SUM(stock_on_hand), 0) as "totalStock",
        COALESCE(SUM(stock_on_hand * CAST(sell_ex_vat AS DECIMAL)), 0) as "totalValue"
      FROM products 
      WHERE category = 'Footwear'
    `);

        const summary = result.rows[0];
        const totalValue = Number(summary?.totalValue || 0);
        const totalVAT = totalValue * 0.15;
        const totalWithVAT = totalValue + totalVAT;

        return NextResponse.json({
            productCount: Number(summary?.productCount || 0),
            totalStock: Number(summary?.totalStock || 0),
            totalValue: Math.round(totalValue),
            totalVAT: Math.round(totalVAT),
            totalWithVAT: Math.round(totalWithVAT),
        });
    } catch (error) {
        console.error('Error fetching footwear summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch footwear summary' },
            { status: 500 }
        );
    }
}