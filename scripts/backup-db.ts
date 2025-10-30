import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.json`;

    console.log(`📦 Creating database backup: ${backupFile}`);

    try {
        // Get all essential data
        const [closingBalance, monthlySales, vatComputations] = await Promise.all([
            db.execute(sql`SELECT * FROM closing_balance ORDER BY period_year, period_month`),
            db.execute(sql`SELECT * FROM monthly_sales ORDER BY year, month`),
            db.execute(sql`SELECT * FROM vat_computations ORDER BY year, month`)
        ]);

        const backup = {
            timestamp: new Date().toISOString(),
            database: process.env.DATABASE_URL?.includes('neon.tech') ? 'production' : 'local',
            data: {
                closingBalance: closingBalance.rows,
                monthlySales: monthlySales.rows,
                vatComputations: vatComputations.rows
            }
        };

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

        console.log('✅ Backup completed successfully!');
        console.log(`📊 Backed up:`);
        console.log(`   - ${closingBalance.rows.length} closing balance entries`);
        console.log(`   - ${monthlySales.rows.length} monthly sales entries`);
        console.log(`   - ${vatComputations.rows.length} VAT computation entries`);
        console.log(`📁 Saved to: ${backupFile}`);

    } catch (error) {
        console.error('❌ Backup failed:', error);
    }
}

backupDatabase();