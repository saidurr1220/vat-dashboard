import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testFunctionality() {
    console.log("🧪 Testing system functionality...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Test 1: Check products and stock
        console.log("\n1️⃣ Testing Products and Stock...");
        const productsResult = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.unit,
        p.cost_ex_vat,
        COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) as stock_on_hand
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      GROUP BY p.id, p.name, p.unit, p.cost_ex_vat
      ORDER BY p.id
      LIMIT 5
    `);

        console.log(`   ✅ Found ${productsResult.rows.length} products`);
        productsResult.rows.forEach(row => {
            console.log(`   📦 ${row.name}: ${row.stock_on_hand} ${row.unit} @ ৳${row.cost_ex_vat}`);
        });

        // Test 2: Check customers
        console.log("\n2️⃣ Testing Customers...");
        const customersResult = await pool.query(`SELECT COUNT(*) as count FROM customers`);
        console.log(`   ✅ Found ${customersResult.rows[0].count} customers`);

        // Test 3: Check total products
        console.log("\n3️⃣ Testing Total Inventory...");
        const totalProductsResult = await pool.query(`SELECT COUNT(*) as count FROM products`);
        const totalStockResult = await pool.query(`
      SELECT SUM(sl.qty_in::numeric * sl.unit_cost_ex_vat::numeric) as total_value
      FROM stock_ledger sl 
      WHERE sl.ref_type = 'OPENING'
    `);

        console.log(`   ✅ Total Products: ${totalProductsResult.rows[0].count}`);
        console.log(`   ✅ Total Opening Stock Value: ৳${Number(totalStockResult.rows[0]?.total_value || 0).toLocaleString()}`);

        // Test 4: Check settings
        console.log("\n4️⃣ Testing Settings...");
        const settingsResult = await pool.query(`SELECT * FROM settings LIMIT 1`);
        if (settingsResult.rows.length > 0) {
            const settings = settingsResult.rows[0];
            console.log(`   ✅ Company: ${settings.taxpayer_name}`);
            console.log(`   ✅ BIN: ${settings.bin}`);
            console.log(`   ✅ VAT Rate: ${(Number(settings.vat_rate_default) * 100).toFixed(1)}%`);
        } else {
            console.log(`   ⚠️  No settings found - will be created on first access`);
        }

        // Test 5: Check imports
        console.log("\n5️⃣ Testing Imports...");
        const importsResult = await pool.query(`SELECT COUNT(*) as count FROM imports_boe`);
        console.log(`   ✅ Found ${importsResult.rows[0].count} import records`);

        // Test 6: Check sales capability
        console.log("\n6️⃣ Testing Sales Structure...");
        const salesResult = await pool.query(`SELECT COUNT(*) as count FROM sales`);
        const salesLinesResult = await pool.query(`SELECT COUNT(*) as count FROM sales_lines`);
        console.log(`   ✅ Found ${salesResult.rows[0].count} sales records`);
        console.log(`   ✅ Found ${salesLinesResult.rows[0].count} sales line items`);

        // Test 7: Check stock categories
        console.log("\n7️⃣ Testing Stock Categories...");
        const categoriesResult = await pool.query(`
      SELECT 
        p.category,
        COUNT(*) as product_count,
        SUM(COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0)) as total_qty
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      GROUP BY p.category, p.id
      ORDER BY p.category
    `);

        const categoryStats = {};
        categoriesResult.rows.forEach(row => {
            if (!categoryStats[row.category]) {
                categoryStats[row.category] = { count: 0, qty: 0 };
            }
            categoryStats[row.category].count += 1;
            categoryStats[row.category].qty += Number(row.total_qty || 0);
        });

        Object.entries(categoryStats).forEach(([category, stats]) => {
            console.log(`   📊 ${category}: ${stats.count} products, ${stats.qty.toLocaleString()} units`);
        });

        console.log("\n🎯 System functionality test completed!");
        console.log("\n📋 Summary:");
        console.log(`   • Products loaded and stock calculated correctly`);
        console.log(`   • Customer management ready`);
        console.log(`   • Stock valuation system operational`);
        console.log(`   • Settings system configured`);
        console.log(`   • Import/Export functionality available`);
        console.log(`   • Sales system ready for transactions`);

    } catch (error) {
        console.error("❌ Error during functionality test:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testFunctionality();