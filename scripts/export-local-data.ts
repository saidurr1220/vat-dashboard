import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

// Connect to LOCAL database
const LOCAL_DB_URL = "postgresql://postgres:2155@127.0.0.1:5432/mydb";

async function exportLocalData() {
    console.log('📤 Exporting data from LOCAL database...');

    try {
        // Create connection to LOCAL database
        const pool = new Pool({
            connectionString: LOCAL_DB_URL,
            ssl: false, // No SSL for local
        });
        const db = drizzle(pool);

        // Test connection
        await db.execute(sql`SELECT 1`);
        console.log('✅ Connected to local database');

        // Export closing balance data
        const closingBalanceData = await db.execute(sql`
      SELECT * FROM closing_balance ORDER BY period_year, period_month
    `);

        // Export monthly sales data (if exists)
        let monthlySalesData = { rows: [] };
        try {
            monthlySalesData = await db.execute(sql`
        SELECT * FROM monthly_sales ORDER BY year, month
      `);
        } catch (error) {
            console.log('Monthly sales table might not exist');
        }

        // Export VAT computations (if exists)
        let vatComputationsData = { rows: [] };
        try {
            vatComputationsData = await db.execute(sql`
        SELECT * FROM vat_computations ORDER BY year, month
      `);
        } catch (error) {
            console.log('VAT computations table might not exist');
        }

        // Export sales data (if exists)
        let salesData = { rows: [] };
        try {
            salesData = await db.execute(sql`
        SELECT * FROM sales ORDER BY dt DESC LIMIT 100
      `);
        } catch (error) {
            console.log('Sales table might not exist');
        }

        const exportData = {
            closingBalance: closingBalanceData.rows,
            monthlySales: monthlySalesData.rows,
            vatComputations: vatComputationsData.rows,
            sales: salesData.rows,
            exportedAt: new Date().toISOString(),
            source: 'local_database'
        };

        // Save to file
        fs.writeFileSync('local-data-export.json', JSON.stringify(exportData, null, 2));

        console.log('✅ Local data exported successfully to local-data-export.json');
        console.log(`📊 Exported:`);
        console.log(`   - ${closingBalanceData.rows.length} closing balance entries`);
        console.log(`   - ${monthlySalesData.rows.length} monthly sales entries`);
        console.log(`   - ${vatComputationsData.rows.length} VAT computation entries`);
        console.log(`   - ${salesData.rows.length} sales entries`);

        await pool.end();

    } catch (error) {
        console.error('❌ Local export failed:', error);
    }
}

exportLocalData();