import { db, pool } from '@/db/client';

async function checkTables() {
    try {
        console.log('🔍 Checking database tables...');

        // Query to get all tables
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('📋 Available tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Check if sales table exists
        const salesExists = result.rows.some(row => row.table_name === 'sales');
        console.log(`\n📊 Sales table exists: ${salesExists}`);

        if (salesExists) {
            // Check sales table structure
            const salesStructure = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'sales' 
                ORDER BY ordinal_position;
            `);

            console.log('\n🏗️ Sales table structure:');
            salesStructure.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });

            // Check if there's data in sales table
            const salesCount = await pool.query('SELECT COUNT(*) as count FROM sales');
            console.log(`\n📈 Sales records count: ${salesCount.rows[0].count}`);
        }

    } catch (error) {
        console.error('❌ Error checking tables:', error);
    } finally {
        await pool.end();
    }
}

checkTables();