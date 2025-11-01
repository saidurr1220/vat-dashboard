import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        console.log('🔧 Adding stock_on_hand column to products table...');

        // Add stock_on_hand column to products table
        await db.execute(sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS stock_on_hand numeric DEFAULT 0 NOT NULL;
    `);

        console.log('✅ Added stock_on_hand column');

        // Set some initial stock values for testing
        await db.execute(sql`
      UPDATE products 
      SET stock_on_hand = 2002 
      WHERE id = 3;
    `);

        await db.execute(sql`
      UPDATE products 
      SET stock_on_hand = 100 
      WHERE id = 5;
    `);

        await db.execute(sql`
      UPDATE products 
      SET stock_on_hand = 50 
      WHERE id = 12;
    `);

        console.log('✅ Set initial stock values');

        // Verify the changes
        const result = await db.execute(sql`
      SELECT id, name, stock_on_hand 
      FROM products 
      WHERE id IN (3, 5, 12)
      ORDER BY id;
    `);

        return NextResponse.json({
            success: true,
            message: 'Stock column added and initialized successfully',
            products: result.rows
        });

    } catch (error) {
        console.error('❌ Error adding stock column:', error);
        return NextResponse.json(
            { error: 'Failed to add stock column', details: error.message },
            { status: 500 }
        );
    }
}