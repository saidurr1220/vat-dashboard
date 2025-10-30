import { db } from '@/db/client';
import { sales } from '@/db/schema';
import { desc } from 'drizzle-orm';

async function testSalesQuery() {
    try {
        console.log('🔍 Testing sales query...');

        // Test the exact query that's failing
        const salesData = await db
            .select()
            .from(sales)
            .orderBy(desc(sales.dt), desc(sales.id))
            .limit(50);

        console.log(`✅ Successfully fetched ${salesData.length} sales records`);

        if (salesData.length > 0) {
            console.log('📊 Sample record:');
            console.log(JSON.stringify(salesData[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Error testing sales query:', error);
    }
}

testSalesQuery();