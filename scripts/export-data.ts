import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function exportData() {
    console.log('📤 Exporting data from database...');

    try {
        // Export closing balance data
        const closingBalanceData = await db.execute(sql`
      SELECT * FROM closing_balance ORDER BY period_year, period_month
    `);

        // Export monthly sales data
        const monthlySalesData = await db.execute(sql`
      SELECT * FROM monthly_sales ORDER BY year, month
    `);

        // Export VAT computations
        const vatComputationsData = await db.execute(sql`
      SELECT * FROM vat_computations ORDER BY year, month
    `);

        const exportData = {
            closingBalance: closingBalanceData.rows,
            monthlySales: monthlySalesData.rows,
            vatComputations: vatComputationsData.rows,
            exportedAt: new Date().toISOString()
        };

        // Save to file
        fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));

        console.log('✅ Data exported successfully to data-export.json');
        console.log(`📊 Exported:`);
        console.log(`   - ${closingBalanceData.rows.length} closing balance entries`);
        console.log(`   - ${monthlySalesData.rows.length} monthly sales entries`);
        console.log(`   - ${vatComputationsData.rows.length} VAT computation entries`);

    } catch (error) {
        console.error('❌ Export failed:', error);
    }
}

exportData();