import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function importData() {
    console.log('📥 Importing data to production database...');

    if (!fs.existsSync('data-export.json')) {
        console.error('❌ data-export.json not found. Run export first.');
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));

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

        console.log('🔄 Importing monthly sales data...');
        for (const row of data.monthlySales) {
            await db.execute(sql`
        INSERT INTO monthly_sales (
          year, month, total_gross, total_net, total_vat
        ) VALUES (
          ${row.year}, ${row.month}, ${row.total_gross || 0},
          ${row.total_net || 0}, ${row.total_vat || 0}
        ) ON CONFLICT (year, month) DO UPDATE SET
          total_gross = EXCLUDED.total_gross,
          total_net = EXCLUDED.total_net,
          total_vat = EXCLUDED.total_vat
      `);
        }

        console.log('🔄 Importing VAT computations...');
        for (const row of data.vatComputations) {
            await db.execute(sql`
        INSERT INTO vat_computations (
          year, month, gross_sales, net_sales_ex_vat, vat_payable,
          used_from_closing_balance, treasury_needed, locked
        ) VALUES (
          ${row.year}, ${row.month}, ${row.gross_sales || 0},
          ${row.net_sales_ex_vat || 0}, ${row.vat_payable || 0},
          ${row.used_from_closing_balance || 0}, ${row.treasury_needed || 0},
          ${row.locked || false}
        ) ON CONFLICT (year, month) DO UPDATE SET
          gross_sales = EXCLUDED.gross_sales,
          net_sales_ex_vat = EXCLUDED.net_sales_ex_vat,
          vat_payable = EXCLUDED.vat_payable,
          used_from_closing_balance = EXCLUDED.used_from_closing_balance,
          treasury_needed = EXCLUDED.treasury_needed,
          locked = EXCLUDED.locked
      `);
        }

        console.log('✅ Data import completed successfully!');
        console.log(`📊 Imported:`);
        console.log(`   - ${data.closingBalance.length} closing balance entries`);
        console.log(`   - ${data.monthlySales.length} monthly sales entries`);
        console.log(`   - ${data.vatComputations.length} VAT computation entries`);

    } catch (error) {
        console.error('❌ Import failed:', error);
    }
}

importData();