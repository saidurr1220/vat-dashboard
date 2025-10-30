import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { priceMemory } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // First try to create the table if it doesn't exist
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS price_memory (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL REFERENCES products(id),
                    last_price DECIMAL(10,2) NOT NULL,
                    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(product_id)
                )
            `);

            await db.execute(sql`
                CREATE INDEX IF NOT EXISTS price_memory_last_used_idx ON price_memory(last_used)
            `);
        } catch (createError) {
            console.log('Table might already exist:', createError);
        }

        const result = await db.execute(sql`
            SELECT 
                product_id as "productId",
                last_price as "lastPrice",
                last_used as "lastUsed"
            FROM price_memory 
            ORDER BY last_used DESC
            LIMIT 20
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching price memory:', error);
        return NextResponse.json([], { status: 200 }); // Return empty array if error
    }
}

export async function POST(request: NextRequest) {
    try {
        const { productId, price } = await request.json();

        if (!productId || !price || isNaN(Number(price))) {
            return NextResponse.json(
                { error: 'Valid product ID and price are required' },
                { status: 400 }
            );
        }

        // Ensure table exists
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS price_memory (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL REFERENCES products(id),
                    last_price DECIMAL(10,2) NOT NULL,
                    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(product_id)
                )
            `);
        } catch (createError) {
            console.log('Table might already exist:', createError);
        }

        // Insert or update price memory using raw SQL for better compatibility
        await db.execute(sql`
            INSERT INTO price_memory (product_id, last_price, last_used)
            VALUES (${productId}, ${price}, CURRENT_TIMESTAMP)
            ON CONFLICT (product_id) 
            DO UPDATE SET 
                last_price = ${price},
                last_used = CURRENT_TIMESTAMP
        `);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving price memory:', error);
        return NextResponse.json(
            { error: 'Failed to save price memory' },
            { status: 500 }
        );
    }
}