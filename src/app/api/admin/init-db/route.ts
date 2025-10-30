import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST() {
    try {
        console.log('🚀 Initializing production database...');

        // Test connection
        await db.execute(sql`SELECT 1`);
        console.log('✅ Database connection successful');

        // Create essential tables
        console.log('🔄 Creating tables...');

        // Create closing_balance table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS closing_balance (
                id SERIAL PRIMARY KEY,
                period_year INTEGER NOT NULL,
                period_month INTEGER NOT NULL,
                opening_balance DECIMAL(15,2) DEFAULT 0,
                current_month_addition DECIMAL(15,2) DEFAULT 0,
                used_amount DECIMAL(15,2) DEFAULT 0,
                closing_balance DECIMAL(15,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(period_year, period_month)
            )
        `);

        // Create monthly_sales table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS monthly_sales (
                id SERIAL PRIMARY KEY,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                total_gross DECIMAL(15,2) DEFAULT 0,
                total_net DECIMAL(15,2) DEFAULT 0,
                total_vat DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(year, month)
            )
        `);

        // Create vat_computations table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS vat_computations (
                id SERIAL PRIMARY KEY,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                gross_sales DECIMAL(15,2) DEFAULT 0,
                net_sales_ex_vat DECIMAL(15,2) DEFAULT 0,
                vat_payable DECIMAL(15,2) DEFAULT 0,
                used_from_closing_balance DECIMAL(15,2) DEFAULT 0,
                treasury_needed DECIMAL(15,2) DEFAULT 0,
                locked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(year, month)
            )
        `);

        // Create basic sales table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                dt DATE NOT NULL,
                customer_name VARCHAR(255),
                total_value DECIMAL(15,2) NOT NULL,
                amount_type VARCHAR(10) DEFAULT 'EXCL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create vat_ledger table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS vat_ledger (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                description TEXT,
                amount DECIMAL(15,2) NOT NULL,
                type VARCHAR(20) NOT NULL,
                period_year INTEGER NOT NULL,
                period_month INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create treasury_challans table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS treasury_challans (
                id SERIAL PRIMARY KEY,
                voucher_no VARCHAR(50),
                token_no VARCHAR(50) NOT NULL,
                bank VARCHAR(100),
                branch VARCHAR(100),
                date DATE NOT NULL,
                account_code VARCHAR(50) NOT NULL,
                amount_bdt DECIMAL(15,2) NOT NULL,
                period_year INTEGER NOT NULL,
                period_month INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert sample data
        await db.execute(sql`
            INSERT INTO closing_balance (period_year, period_month, opening_balance, current_month_addition, used_amount, closing_balance, notes)
            VALUES (2024, 12, 0, 1000000, 200000, 800000, 'Initial production setup')
            ON CONFLICT (period_year, period_month) DO NOTHING
        `);

        return NextResponse.json({
            success: true,
            message: 'Database initialized successfully',
            tables: ['closing_balance', 'monthly_sales', 'vat_computations', 'sales', 'vat_ledger', 'treasury_challans']
        });

    } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Database initialization failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}