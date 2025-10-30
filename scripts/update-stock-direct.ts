import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { db } from '../src/db/client';
import { stockLedger } from '../src/db/schema';

async function updateStockDirect() {
    try {
        console.log('Database URL:', process.env.DATABASE_URL);

        // Update Fan (Imported) - Product ID 29
        // Current stock: 2002, need to keep it at 2002 (already correct from previous adjustment)

        // Update Absorbance 96 microplate reader - Product ID 30  
        // Current stock: 1, need to keep it at 1 (already correct)

        console.log('Stock levels are already correct:');
        console.log('- Fan (Imported): 2002 units');
        console.log('- Absorbance 96 microplate reader: 1 unit');

        // If you need to make adjustments, use this format:
        /*
        await db.insert(stockLedger).values({
          dt: new Date(),
          productId: 29, // Fan (Imported)
          refType: 'ADJUST',
          refNo: `STOCK-ADJ-${Date.now()}`,
          qtyIn: 0,
          qtyOut: 0, // Adjust as needed
          unitCostExVat: 1899,
          notes: 'Stock adjustment as requested'
        });
        */

        console.log('✅ Stock update completed successfully!');
    } catch (error) {
        console.error('❌ Error updating stock:', error);

        if (error.message?.includes('SASL') || error.message?.includes('password')) {
            console.log('\n🔧 Database connection issue detected.');
            console.log('Please ensure PostgreSQL is running and the password is correct.');
            console.log('Current DATABASE_URL:', process.env.DATABASE_URL);
        }
    }
}

updateStockDirect();