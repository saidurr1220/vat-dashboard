import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedWorkingData() {
    console.log("🌱 Starting working database seeding...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Add settings
        console.log("📊 Seeding settings...");
        await pool.query(`
            INSERT INTO settings (bin, taxpayer_name, address, vat_rate_default, currency, tests_per_kit_default, simple_chalan_threshold)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT DO NOTHING
        `, [
            "004223577-0205",
            "M S RAHMAN TRADERS",
            "174. Siddique Bazar, Dhaka; Bangshal PS; Dhaka - 1000; Bangladesh",
            "0.15",
            "BDT",
            120,
            "200000"
        ]);

        // Add sample products
        console.log("📦 Adding sample products...");

        // BioShield product
        await pool.query(`
            INSERT INTO products (sku, name, hs_code, category, unit, tests_per_kit, cost_ex_vat, sell_ex_vat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT DO NOTHING
        `, [
            "BS-COVID-001",
            "BioShield COVID-19 Test Kit",
            "90279050",
            "BioShield",
            "Kit",
            120,
            "5000",
            "6000"
        ]);

        // Fan product
        await pool.query(`
            INSERT INTO products (sku, name, hs_code, category, unit, cost_ex_vat, sell_ex_vat)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT DO NOTHING
        `, [
            "FAN-CEIL-001",
            "Ceiling Fan Complete Set",
            "84145100",
            "Fan",
            "Pc",
            "2500",
            "3500"
        ]);

        // Footwear product
        await pool.query(`
            INSERT INTO products (sku, name, hs_code, category, unit, cost_ex_vat, sell_ex_vat)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT DO NOTHING
        `, [
            "SHOE-SPORT-001",
            "Sports Shoes Carton",
            "64041100",
            "Footwear",
            "CTN",
            "8000",
            "12000"
        ]);

        // Add opening stock
        console.log("📋 Adding opening stock...");
        const products = await pool.query('SELECT id, name FROM products ORDER BY id');

        for (const product of products.rows) {
            await pool.query(`
                INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            `, [
                new Date('2021-11-01'),
                product.id,
                'OPENING',
                'OPENING-STOCK',
                "100",
                "0",
                "0"
            ]);
        }

        // Add sample sales
        console.log("💰 Adding sample sales...");

        if (products.rows.length > 0) {
            // Sample sale 1 - VAT Inclusive
            const sale1Result = await pool.query(`
                INSERT INTO sales (invoice_no, dt, customer, total_value, amount_type, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [
                'INV-001',
                new Date('2025-10-15'),
                'ABC Medical Center',
                "23000",
                'INCL',
                'Sample sale for testing'
            ]);

            // Add sale lines for sale 1
            await pool.query(`
                INSERT INTO sales_lines (sale_id, product_id, unit, qty, unit_price_value, amount_type, line_total_calc)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            `, [
                sale1Result.rows[0].id,
                products.rows[0].id,
                'Kit',
                "2",
                "11500",
                'INCL',
                "23000"
            ]);

            // Sample sale 2 - VAT Exclusive
            const sale2Result = await pool.query(`
                INSERT INTO sales (invoice_no, dt, customer, total_value, amount_type, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [
                'INV-002',
                new Date('2025-10-20'),
                'XYZ Electronics',
                "10500",
                'EXCL',
                'Sample sale for testing'
            ]);

            // Add sale lines for sale 2
            await pool.query(`
                INSERT INTO sales_lines (sale_id, product_id, unit, qty, unit_price_value, amount_type, line_total_calc)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            `, [
                sale2Result.rows[0].id,
                products.rows[1].id,
                'Pc',
                "3",
                "3500",
                'EXCL',
                "10500"
            ]);
        }

        // Add sample treasury challans
        console.log("🏦 Adding sample treasury challans...");
        await pool.query(`
            INSERT INTO treasury_challans (voucher_no, token_no, bank, branch, date, account_code, amount_bdt, period_year, period_month)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING
        `, [
            "CH-2025-001",
            "TK-001",
            "Sonali Bank",
            "Dhaka Main",
            new Date('2025-09-15'),
            "1/1143/0016/0311",
            "50000",
            2025,
            9
        ]);

        // Add closing balance
        console.log("💰 Adding closing balance...");
        await pool.query(`
            INSERT INTO closing_balance (period_year, period_month, amount_bdt)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
        `, [
            2025,
            10,
            "75000"
        ]);

        console.log("✅ Working database seeding completed successfully!");
        console.log(`\n🎯 Ready for production use!`);
        console.log(`   Products: ${products.rows.length}`);
        console.log(`   Sales: 2`);
        console.log(`   Treasury Challans: 1`);

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seedWorkingData();