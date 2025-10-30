import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

// Connect to LOCAL database
const LOCAL_DB_URL = "postgresql://postgres:2155@127.0.0.1:5432/mydb";

async function exportAllLocalData() {
    console.log('📤 Exporting ALL data from LOCAL database...');

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

        const exportData: any = {
            exportedAt: new Date().toISOString(),
            source: 'local_database_complete'
        };

        // Export all tables
        const tables = [
            'closing_balance',
            'monthly_sales',
            'vat_computations',
            'sales',
            'products',
            'customers',
            'imports_boe',
            'boe_lots',
            'stock_ledger',
            'sales_lines',
            'treasury_challans',
            'vat_ledger'
        ];

        for (const tableName of tables) {
            try {
                console.log(`📊 Exporting ${tableName}...`);
                const result = await db.execute(sql.raw(`SELECT * FROM ${tableName} ORDER BY id`));
                exportData[tableName] = result.rows;
                console.log(`   ✅ ${result.rows.length} records from ${tableName}`);
            } catch (error) {
                console.log(`   ⚠️  Table ${tableName} might not exist or is empty`);
                exportData[tableName] = [];
            }
        }

        // Save to file
        fs.writeFileSync('complete-local-export.json', JSON.stringify(exportData, null, 2));

        console.log('✅ Complete local data exported successfully!');
        console.log('📁 Saved to: complete-local-export.json');

        // Show summary
        console.log('\n📊 Export Summary:');
        for (const [table, data] of Object.entries(exportData)) {
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   - ${table}: ${data.length} records`);
            }
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Complete export failed:', error);
    }
}

exportAllLocalData();