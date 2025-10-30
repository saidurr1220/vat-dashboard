import { db } from "../src/db/client";
import { sales } from "../src/db/schema";

async function testSales() {
    console.log("🔍 Testing sales table...");

    try {
        // Test basic select
        const result = await db.select().from(sales).limit(5);
        console.log("✅ Sales query successful!");
        console.log(`Found ${result.length} sales records`);

        if (result.length > 0) {
            console.log("Sample record:", result[0]);
        }

    } catch (error) {
        console.error("❌ Sales query failed:", error);
    }

    process.exit(0);
}

testSales();