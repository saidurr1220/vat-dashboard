import { db } from '../src/db/client';
import { products, stockLedger } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function updateStock() {
    try {
        // Find Fan (Imported) product
        const fanProducts = await db.select().from(products).where(eq(products.name, 'Fan (Imported)'));
        console.log('Found Fan products:', fanProducts);

        // Find Absorbance 96 microplate reader product  
        const absorbanceProducts = await db.select().from(products).where(eq(products.name, 'Absorbance 96 microplate reader'));
        console.log('Found Absorbance products:', absorbanceProducts);

        if (fanProducts.length > 0) {
            const fanProduct = fanProducts[0];
            console.log(`Updating stock for Fan (Imported) - Product ID: ${fanProduct.id}`);

            // Add stock adjustment entry for Fan to make total 2002
            await db.insert(stockLedger).values({
                productId: fanProduct.id,
                transactionType: 'adjustment',
                referenceType: 'manual',
                referenceId: 'stock-update-' + Date.now(),
                qtyIn: 2002,
                qtyOut: 0,
                costPerUnit: '1899',
                totalCost: (2002 * 1899).toString(),
                notes: 'Stock adjustment to set total to 2002 units'
            });

            console.log('✅ Updated Fan stock to 2002 units');
        }

        if (absorbanceProducts.length > 0) {
            const absorbanceProduct = absorbanceProducts[0];
            console.log(`Updating stock for Absorbance reader - Product ID: ${absorbanceProduct.id}`);

            // Add stock adjustment entry for Absorbance to make total 1
            await db.insert(stockLedger).values({
                productId: absorbanceProduct.id,
                transactionType: 'adjustment',
                referenceType: 'manual',
                referenceId: 'stock-update-' + Date.now() + '-abs',
                qtyIn: 1,
                qtyOut: 0,
                costPerUnit: '524815.2',
                totalCost: '524815.2',
                notes: 'Stock adjustment to set total to 1 unit'
            });

            console.log('✅ Updated Absorbance reader stock to 1 unit');
        }

        console.log('Stock updates completed successfully!');
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

updateStock();