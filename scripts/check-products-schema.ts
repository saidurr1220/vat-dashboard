import { pool } from '@/db/client';

async function checkProductsSchema() {
    try {
        console.log('🔍 Checking products table schema...');

        // Check products table structure
        const productsStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            ORDER BY ordinal_position;
        `);

        console.log('\n🏗️ Products table structure:');
        productsStructure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // Check sales_lines table structure
        const salesLinesStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'sales_lines' 
            ORDER BY ordinal_position;
        `);

        console.log('\n🏗️ Sales_lines table structure:');
        salesLinesStructure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // Test a simple query first
        const simpleTest = await pool.query('SELECT id, name, category FROM products LIMIT 1');
        console.log('\n✅ Simple products query works');

    } catch (error) {
        console.error('❌ Error checking schema:', error);
    } finally {
        await pool.end();
    }
}

checkProductsSchema();