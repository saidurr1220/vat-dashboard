import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables properly
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { db } from '../src/db/client';
import { stockLedger, products } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function setStockLevels() {
    try {
        console.log('🔄 Setting stock levels as requested...');

        // Get current stock levels
        const currentStock = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) as current_stock
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      WHERE p.name IN ('Fan (Imported)', 'Absorbance 96 microplate reader')
      GROUP BY p.id, p.name
      ORDER BY p.name
    `);

        console.log('\n📊 Current Stock Levels:');
        currentStock.rows.forEach(row => {
            console.log(`- ${row.name}: ${row.current_stock} units`);
        });

        // Target stock levels
        const targets = {
            'Fan (Imported)': 2002,
            'Absorbance 96 microplate reader': 1
        };

        console.log('\n🎯 Target Stock Levels:');
        Object.entries(targets).forEach(([name, target]) => {
            console.log(`- ${name}: ${target} units`);
        });

        // Make adjustments if needed
        for (const row of currentStock.rows) {
            const targetStock = targets[row.name as keyof typeof targets];
            const currentStockNum = Number(row.current_stock);
            const difference = targetStock - currentStockNum;

            if (difference !== 0) {
                console.log(`\n🔧 Adjusting ${row.name}: ${currentStockNum} → ${targetStock} (${difference > 0 ? '+' : ''}${difference})`);

                await db.insert(stockLedger).values({
                    dt: new Date(),
                    productId: row.id,
                    refType: 'ADJUST',
                    refNo: `STOCK-SET-${Date.now()}-${row.id}`,
                    qtyIn: difference > 0 ? difference : 0,
                    qtyOut: difference < 0 ? Math.abs(difference) : 0,
                    unitCostExVat: row.name === 'Fan (Imported)' ? 1899 : 524815.2,
                    notes: `Stock level adjustment: set to ${targetStock} units as requested`
                });

                console.log(`✅ ${row.name} stock adjusted successfully`);
            } else {
                console.log(`✅ ${row.name} stock already at target level`);
            }
        }

        // Verify final stock levels
        const finalStock = await db.execute(sql`
      SELECT 
        p.name,
        COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) as final_stock
      FROM products p
      LEFT JOIN stock_ledger sl ON p.id = sl.product_id
      WHERE p.name IN ('Fan (Imported)', 'Absorbance 96 microplate reader')
      GROUP BY p.name
      ORDER BY p.name
    `);

        console.log('\n✅ Final Stock Levels:');
        finalStock.rows.forEach(row => {
            console.log(`- ${row.name}: ${row.final_stock} units`);
        });

        console.log('\n🎉 Stock level update completed successfully!');

    } catch (error) {
        console.error('❌ Error setting stock levels:', error);

        if (error.message?.includes('SASL') || error.message?.includes('password')) {
            console.log('\n🔧 Database connection issue:');
            console.log('- Ensure PostgreSQL is running');
            console.log('- Check password in .env files');
            console.log('- Current DATABASE_URL:', process.env.DATABASE_URL);
        }
    }
}

setStockLevels();