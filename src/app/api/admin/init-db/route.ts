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

        // Create products table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                unit VARCHAR(50) NOT NULL,
                tests_per_kit INTEGER,
                cost_ex_vat DECIMAL(15,2),
                sell_ex_vat DECIMAL(15,2),
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create customers table
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

        // Create sales table without foreign key constraints initially
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                dt DATE NOT NULL,
                customer_id INTEGER,
                customer_name VARCHAR(255),
                total_value DECIMAL(15,2) NOT NULL,
                amount_type VARCHAR(10) DEFAULT 'EXCL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create sales_lines table without foreign key constraints initially
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS sales_lines (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER,
                product_id INTEGER,
                product_name VARCHAR(255),
                quantity DECIMAL(10,2) NOT NULL,
                unit_price DECIMAL(15,2) NOT NULL,
                line_total DECIMAL(15,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create stock_ledger table without foreign key constraints initially
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS stock_ledger (
                id SERIAL PRIMARY KEY,
                product_id INTEGER,
                transaction_type VARCHAR(20) NOT NULL,
                reference_no VARCHAR(100),
                qty_in DECIMAL(10,2) DEFAULT 0,
                qty_out DECIMAL(10,2) DEFAULT 0,
                unit_cost_ex_vat DECIMAL(15,2),
                transaction_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

        // Create imports_boe table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS imports_boe (
                id SERIAL PRIMARY KEY,
                boe_no VARCHAR(50) NOT NULL,
                boe_date DATE NOT NULL,
                office_code VARCHAR(50),
                item_no VARCHAR(50) NOT NULL,
                hs_code VARCHAR(50),
                description TEXT,
                assessable_value DECIMAL(15,2),
                base_vat DECIMAL(15,2),
                sd DECIMAL(15,2),
                vat DECIMAL(15,2),
                at DECIMAL(15,2),
                qty DECIMAL(10,2),
                unit VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(boe_no, item_no)
            )
        `);

        // Create settings table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                taxpayer_name VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                vat_rate_default DECIMAL(5,4) NOT NULL DEFAULT 0.15,
                bin VARCHAR(50) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
                tests_per_kit_default INTEGER NOT NULL DEFAULT 120,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ All tables created successfully');

        // Insert sample data
        console.log('📝 Inserting sample data...');

        // Insert settings
        await db.execute(sql`
            INSERT INTO settings (company_name, taxpayer_name, address, bin)
            VALUES ('M S RAHMAN TRADERS', 'M S RAHMAN TRADERS', 'Dhaka, Bangladesh', '004223577-0205')
            ON CONFLICT DO NOTHING
        `);

        // Insert sample products
        await db.execute(sql`
            INSERT INTO products (name, description, unit, cost_ex_vat, sell_ex_vat, category)
            VALUES 
                ('COVID-19 Rapid Test Kit', 'Antigen rapid test kit for COVID-19', 'Kit', 150.00, 200.00, 'Medical'),
                ('N95 Face Mask', 'Medical grade N95 face mask', 'Piece', 25.00, 35.00, 'Medical'),
                ('Hand Sanitizer 500ml', 'Alcohol-based hand sanitizer', 'Bottle', 80.00, 120.00, 'Medical')
            ON CONFLICT DO NOTHING
        `);

        // Insert sample customers
        await db.execute(sql`
            INSERT INTO customers (name, address, phone, bin)
            VALUES 
                ('ABC Hospital Ltd', 'Dhaka Medical College, Dhaka', '01711111111', '123456789-0101'),
                ('XYZ Pharmacy', 'Dhanmondi, Dhaka', '01722222222', '987654321-0202'),
                ('General Hospital', 'Chittagong Medical College', '01733333333', '456789123-0303')
            ON CONFLICT DO NOTHING
        `);

        // Insert sample closing balance
        await db.execute(sql`
            INSERT INTO closing_balance (period_year, period_month, opening_balance, current_month_addition, used_amount, closing_balance, notes)
            VALUES (2024, 12, 0, 1000000, 200000, 800000, 'Initial production setup')
            ON CONFLICT (period_year, period_month) DO NOTHING
        `);

        // Insert sample monthly sales
        await db.execute(sql`
            INSERT INTO monthly_sales (year, month, total_gross, total_net, total_vat)
            VALUES (2024, 12, 1200000, 1000000, 200000)
            ON CONFLICT (year, month) DO NOTHING
        `);

        return NextResponse.json({
            success: true,
            message: 'Database initialized successfully with sample data',
            tables: [
                'closing_balance', 'monthly_sales', 'vat_computations',
                'products', 'customers', 'sales', 'sales_lines',
                'stock_ledger', 'vat_ledger', 'treasury_challans',
                'imports_boe', 'settings'
            ]
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