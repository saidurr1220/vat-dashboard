import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

// Connect to PRODUCTION database (Neon) - Use environment variable
const PRODUCTION_DB_URL = process.env.DATABASE_URL || "";

async function importToProduction() {
  console.log('📥 Importing local data to PRODUCTION database...');

  if (!fs.existsSync('local-data-export.json')) {
    console.error('❌ local-data-export.json not found. Run export:local first.');
    return;
  }

  try {
    // Create connection to PRODUCTION database
    const pool = new Pool({
      connectionString: PRODUCTION_DB_URL,
      ssl: { rejectUnauthorized: false },
    });
    const db = drizzle(pool);

    // Test connection
    await db.execute(sql`SELECT 1`);
    console.log('✅ Connected to production database');

    const data = JSON.parse(fs.readFileSync('local-data-export.json', 'utf8'));

    console.log('🔄 Importing closing balance data...');
    for (const row of data.closingBalance) {
      await db.execute(sql`
        INSERT INTO closing_balance (
          period_year, period_month, opening_balance, 
          current_month_addition, used_amount, closing_balance, notes
        ) VALUES (
          ${row.period_year}, ${row.period_month}, ${row.opening_balance || 0},
          ${row.current_month_addition || 0}, ${row.used_amount || 0}, 
          ${row.closing_balance || 0}, ${row.notes || ''}
        ) ON CONFLICT (period_year, period_month) DO UPDATE SET
          opening_balance = EXCLUDED.opening_balance,
          current_month_addition = EXCLUDED.current_month_addition,
          used_amount = EXCLUDED.used_amount,
          closing_balance = EXCLUDED.closing_balance,
          notes = EXCLUDED.notes
      `);
    }

    console.log('🔄 Importing sales data...');
    for (const row of data.sales) {
      try {
        await db.execute(sql`
          INSERT INTO sales (
            invoice_no, dt, customer_name, total_value, amount_type
          ) VALUES (
            ${row.invoice_no}, ${row.dt}, ${row.customer || row.customer_name || 'Unknown'}, 
            ${row.total_value || 0}, ${row.amount_type || 'EXCL'}
          ) ON CONFLICT (invoice_no) DO UPDATE SET
            customer_name = EXCLUDED.customer_name,
            total_value = EXCLUDED.total_value,
            amount_type = EXCLUDED.amount_type
        `);
      } catch (error) {
        console.log(`Skipping sales record ${row.invoice_no}: might already exist`);
      }
    }

    console.log('✅ Data import to production completed successfully!');
    console.log(`📊 Imported:`);
    console.log(`   - ${data.closingBalance.length} closing balance entries`);
    console.log(`   - ${data.sales.length} sales entries`);

    await pool.end();

  } catch (error) {
    console.error('❌ Production import failed:', error);
  }
}

importToProduction();