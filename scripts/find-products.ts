import { db } from '../src/db/client';
import { products } from '../src/db/schema';
import { like } from 'drizzle-orm';

async function findProducts() {
    const fanProduct = await db.select().from(products).where(like(products.name, '%Fan (Imported)%'));
    const absorbanceProduct = await db.select().from(products).where(like(products.name, '%Absorbance 96 microplate reader%'));

    console.log('Fan Product:', fanProduct);
    console.log('Absorbance Product:', absorbanceProduct);
}

findProducts().catch(console.error);