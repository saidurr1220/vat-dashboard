import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createTestSale() {
    console.log("🛒 Creating test sale...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Get first product and customer
        const productResult = await pool.query(`
      SELECT id, name, unit, sell_ex_vat 
      FROM products 
      WHERE sell_ex_vat IS NOT NULL AND sell_ex_vat != '0'
      LIMIT 1
    `);

        const customerResult = await pool.query(`
      SELECT id, name FROM customers LIMIT 1
    `);

        if (productResult.rows.length === 0) {
            console.log("❌ No products found with selling price");
            return;
        }

        if (customerResult.rows.length === 0) {
            console.log("❌ No customers found");
            return;
        }

        const product = productResult.rows[0];
        const customer = customerResult.rows[0];

        console.log(`📦 Using product: ${product.name}`);
        console.log(`👤 Using customer: ${customer.name}`);

        // Create test sale
        const saleResult = await pool.query(`
      INSERT INTO sales (invoice_no, dt, customer_id, customer, amount_type, total_value, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
            'TEST-001',
            new Date(),
            customer.id,
            customer.name,
            'EXCL',
            (Number(product.sell_ex_vat) * 2).toString(), // 2 units
            'Test sale for functionality testing'
        ]);

        const saleId = saleResult.rows[0].id;

        // Create sale line
        await pool.query(`
      INSERT INTO sales_lines (sale_id, product_id, unit, qty, unit_price_value, amount_type, line_total_calc)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
            saleId,
            product.id,
            product.unit,
            '2',
            product.sell_ex_vat,
            'EXCL',
            (Number(product.sell_ex_vat) * 2).toString()
        ]);

        // Create stock ledger entry
        await pool.query(`
      INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
            new Date(),
            product.id,
            'SALE',
            'TEST-001',
            '0',
            '2',
            '0'
        ]);

        console.log(`✅ Test sale created with ID: ${saleId}`);
        console.log(`📋 Invoice: TEST-001`);
        console.log(`💰 Total: ৳${(Number(product.sell_ex_vat) * 2).toLocaleString()}`);
        console.log(`\n🌐 Test at: http://localhost:3001/sales/${saleId}`);

    } catch (error) {
        console.error("❌ Error creating test sale:", error);
    } finally {
        await pool.end();
    }
}

createTestSale();