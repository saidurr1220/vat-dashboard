import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST() {
    try {
        console.log('🚀 Creating basic tables...');

        // Test connection first
        await db.execute(sql`SELECT 1`);
        console.log('✅ Database connection successful');

        // Create products table
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    unit VARCHAR(50) NOT NULL DEFAULT 'Piece',
                    cost_ex_vat DECIMAL(15,2) DEFAULT 0,
                    sell_ex_vat DECIMAL(15,2) DEFAULT 0,
                    category VARCHAR(100) DEFAULT 'General',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Products table created');
        } catch (error) {
            console.log('Products table might already exist');
        }

        // Create customers table
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS customers (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    address TEXT,
                    phone VARCHAR(20),
                    bin VARCHAR(50),
                    nid VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Customers table created');
        } catch (error) {
            console.log('Customers table might already exist');
        }

        // Insert sample products
        try {
            await db.execute(sql`
                INSERT INTO products (name, description, unit, cost_ex_vat, sell_ex_vat, category)
                VALUES 
                    ('COVID-19 Test Kit', 'Rapid antigen test kit', 'Kit', 150.00, 200.00, 'Medical'),
                    ('Face Mask N95', 'Medical grade face mask', 'Piece', 25.00, 35.00, 'Medical'),
                    ('Hand Sanitizer', 'Alcohol-based sanitizer 500ml', 'Bottle', 80.00, 120.00, 'Medical')
                ON CONFLICT DO NOTHING
            `);
            console.log('✅ Sample products inserted');
        } catch (error) {
            console.log('Sample products might already exist');
        }

        // Insert sample customers
        try {
            await db.execute(sql`
                INSERT INTO customers (name, address, phone, bin)
                VALUES 
                    ('ABC Hospital Ltd', 'Dhaka Medical College, Dhaka', '01711111111', '123456789-0101'),
                    ('XYZ Pharmacy', 'Dhanmondi, Dhaka', '01722222222', '987654321-0202'),
                    ('General Hospital', 'Chittagong Medical College', '01733333333', '456789123-0303')
                ON CONFLICT DO NOTHING
            `);
            console.log('✅ Sample customers inserted');
        } catch (error) {
            console.log('Sample customers might already exist');
        }

        return NextResponse.json({
            success: true,
            message: 'Basic tables created successfully with sample data',
            tables: ['products', 'customers']
        });

    } catch (error) {
        console.error('Basic table creation failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Basic table creation failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}