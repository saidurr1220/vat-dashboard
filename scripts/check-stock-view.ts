import { pool } from '@/db/client';

async function checkStockView() {
    try {
        console.log('🔍 Checking stock view...');

        // Check if v_stock_position view exists
        const viewExists = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.views 
                WHERE table_name = 'v_stock_position'
            ) as exists
        `);

        console.log(`📊 v_stock_position view exists: ${viewExists.rows[0].exists}`);

        if (viewExists.rows[0].exists) {
            // Get data from the view
            const viewData = await pool.query('SELECT * FROM v_stock_position LIMIT 5');
            console.log(`📋 Records in v_stock_position: ${viewData.rows.length}`);

            if (viewData.rows.length > 0) {
                console.log('\n📦 Sample stock position data:');
                viewData.rows.forEach(row => {
                    console.log(`  ${row.product}: ${row.qty_on_hand} units, Cost: ${row.value_cost}, Sell: ${row.value_sell}`);
                });
            }

            // Get total counts
            const totalCount = await pool.query('SELECT COUNT(*) as count FROM v_stock_position');
            console.log(`\n📈 Total records in v_stock_position: ${totalCount.rows[0].count}`);
        } else {
            console.log('❌ v_stock_position view does not exist!');

            // Check what views do exist
            const existingViews = await pool.query(`
                SELECT table_name 
                FROM information_schema.views 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);

            console.log('\n📋 Available views:');
            existingViews.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking stock view:', error);
    } finally {
        await pool.end();
    }
}

checkStockView();