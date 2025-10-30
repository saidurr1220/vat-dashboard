import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function addSampleData() {
    console.log("📦 Adding sample data...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Add sample products
        console.log("Adding sample products...");

        // BioShield product
        await pool.query(`
      INSERT INTO products (category, name, hs_code, unit, qty_stock_in, cost_ex_vat, sell_ex_vat, tests_per_kit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
    `, [
            "Medical Equipment",
            "BioShield COVID-19 Test Kit",
            "90279050",
            "Kit",
            100,
            5000,
            6000,
            120
        ]);

        // Fan product
        await pool.query(`
      INSERT INTO products (category, name, hs_code, unit, qty_stock_in, cost_ex_vat, sell_ex_vat)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [
            "Electronics",
            "Ceiling Fan Complete Set",
            "84145100",
            "Set",
            50,
            2500,
            3500
        ]);

        // Footwear product
        await pool.query(`
      INSERT INTO products (category, name, hs_code, unit, qty_stock_in, cost_ex_vat, sell_ex_vat)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [
            "Footwear",
            "Sports Shoes Carton",
            "64041100",
            "Ctn",
            25,
            8000,
            12000
        ]);

        // Get product IDs for sales
        const products = await pool.query('SELECT id, name, sell_ex_vat FROM products ORDER BY id');

        if (products.rows.length > 0) {
            console.log("Adding sample sales...");

            // Sample sale 1 - VAT Inclusive
            const sale1Result = await pool.query(`
        INSERT INTO sales (date, invoice_no, customer, amount_type, grand_total, output_vat_15, net_of_vat)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
                new Date('2025-10-15'),
                'INV-001',
                'ABC Medical Center',
                'INCL',
                23000, // Grand total including VAT
                3000,  // VAT = 23000 * 15/115 = 3000
                20000  // Net = 23000 - 3000 = 20000
            ]);

            // Add sale lines for sale 1
            await pool.query(`
        INSERT INTO sale_lines (sale_id, product_id, unit, qty, unit_price_entered, line_amount)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                sale1Result.rows[0].id,
                products.rows[0].id, // BioShield kit
                'Kit',
                2,
                11500, // Price including VAT
                23000
            ]);

            // Sample sale 2 - VAT Exclusive
            const sale2Result = await pool.query(`
        INSERT INTO sales (date, invoice_no, customer, amount_type, grand_total, output_vat_15, net_of_vat)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
                new Date('2025-10-20'),
                'INV-002',
                'XYZ Electronics',
                'EXCL',
                10500, // Grand total excluding VAT
                1575,  // VAT = 10500 * 15% = 1575
                10500  // Net = same as total (VAT exclusive)
            ]);

            // Add sale lines for sale 2
            await pool.query(`
        INSERT INTO sale_lines (sale_id, product_id, unit, qty, unit_price_entered, line_amount)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                sale2Result.rows[0].id,
                products.rows[1].id, // Fan
                'Set',
                3,
                3500,
                10500
            ]);

            console.log("✅ Sample data added successfully!");
            console.log("Products added:", products.rows.length);
            console.log("Sales added: 2");
            console.log("");
            console.log("🎯 You can now:");
            console.log("1. Visit http://localhost:3000 to see the dashboard");
            console.log("2. Click 'Compute VAT for Oct 2025' to test VAT calculation");
            console.log("3. Check Products & Stock page to see inventory");
            console.log("4. View Sales page to see the sample invoices");
        }

    } catch (error) {
        console.error("❌ Error adding sample data:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addSampleData();