import { db } from '@/db/client';
import { importsBoe } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

async function debugImportsPage() {
    try {
        console.log('🔍 Debugging imports page data...');

        // Test the exact same query as the imports page
        console.log('1. Testing imports query...');
        const importsData = await db
            .select({
                id: importsBoe.id,
                boeNo: importsBoe.boeNo,
                boeDate: importsBoe.boeDate,
                officeCode: importsBoe.officeCode,
                itemNo: importsBoe.itemNo,
                hsCode: importsBoe.hsCode,
                description: importsBoe.description,
                assessableValue: importsBoe.assessableValue,
                baseVat: importsBoe.baseVat,
                sd: importsBoe.sd,
                vat: importsBoe.vat,
                at: importsBoe.at,
                qty: importsBoe.qty,
                unit: importsBoe.unit,
            })
            .from(importsBoe)
            .orderBy(desc(importsBoe.boeDate))
            .limit(100);

        console.log(`📦 Found ${importsData.length} import records`);

        if (importsData.length === 0) {
            console.log('❌ No imports found! This explains the blank page.');

            // Check if imports_boe table has any data at all
            const totalImports = await db.execute(sql`SELECT COUNT(*) as count FROM imports_boe`);
            console.log(`📊 Total imports in database: ${totalImports.rows[0]?.count || 0}`);
        } else {
            console.log('✅ Imports found:');
            importsData.slice(0, 3).forEach((imp: any) => {
                console.log(`  - BoE ${imp.boeNo}: ${imp.description} (${imp.boeDate})`);
            });
        }

    } catch (error) {
        console.error('❌ Error debugging imports page:', error);
    }
}

debugImportsPage();