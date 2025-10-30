import { db, pool } from '@/db/client';

async function checkStock() {
    try {
        console.log('🔍 Checking stock data...');

        // Check if stock_ledger table exists and has data
        const stockLedgerCount = await pool.query('SELECT COUNT(*) as count FROM stock_ledger');
        console.log(`📊 Stock ledger records: ${stockLedgerCount.rows[0].count}`);

        if (stockLedgerCount.rows[0].count > 0) {
            // Show sample stock ledger entries
            const sampleEntries = await pool.query(`
                SELECT product_id, qty_in, qty_out, created_at 
                FROM stock_ledger 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            console.log('\n📋 Sample stock ledger entries:');
            sampleEntries.rows.forEach(row => {
                console.log(`  Product ${row.product_id}: +${row.qty_in || 0} -${row.qty_out || 0} (${row.created_at})`);
            });
        }

        // Check current stock calculation
        const stockSummary = await pool.query(`
            SELECT 
                product_id,
                SUM(COALESCE(qty_in::numeric, 0)) as total_in,
                SUM(COALESCE(qty_out::numeric, 0)) as total_out,
                SUM(COALESCE(qty_in::numeric, 0)) - SUM(COALESCE(qty_out::numeric, 0)) as current_stock
            FROM stock_ledger 
            GROUP BY product_id 
            ORDER BY product_id
            LIMIT 10
        `);

        console.log('\n📈 Stock summary by product:');
        stockSummary.rows.forEach(row => {
            console.log(`  Product ${row.product_id}: In=${row.total_in}, Out=${row.total_out}, Stock=${row.current_stock}`);
        });

        // Check products table
        const productsCount = await pool.query('SELECT COUNT(*) as count FROM products');
        console.log(`\n🏷️ Total products: ${productsCount.rows[0].count}`);

        // Check if there are any products with stock
        const productsWithStock = await pool.query(`
            SELECT p.id, p.name, 
                   COALESCE(SUM(sl.qty_in::numeric), 0) - COALESCE(SUM(sl.qty_out::numeric), 0) as stock
            FROM products p
            LEFT JOIN stock_ledger sl ON p.id = sl.product_id
            GROUP BY p.id, p.name
            HAVING COALESCE(SUM(sl.qty_in::numeric), 0) - COALESCE(SUM(sl.qty_out::numeric), 0) > 0
            LIMIT 5
        `);

        console.log('\n📦 Products with stock:');
        if (productsWithStock.rows.length === 0) {
            console.log('  No products have stock!');
        } else {
            productsWithStock.rows.forEach(row => {
                console.log(`  ${row.name} (ID: ${row.id}): ${row.stock} units`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking stock:', error);
    } finally {
        await pool.end();
    }
}

checkStock();