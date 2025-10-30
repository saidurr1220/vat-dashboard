import { db } from "../src/db/client";
import {
    settings, products, importsBoe, stockLedger, treasuryChallans, closingBalance
} from "../src/db/schema";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Category mapping
const categoryMap: Record<string, string> = {
    'footwear': 'Footwear',
    'shoe': 'Footwear',
    'sandal': 'Footwear',
    'boot': 'Footwear',
    'fan': 'Fan',
    'ceiling fan': 'Fan',
    'exhaust fan': 'Fan',
    'bioshield': 'BioShield',
    'reagent': 'BioShield',
    'chemical': 'BioShield',
    'test kit': 'BioShield',
    'instrument': 'Instrument'
};

function detectCategory(name: string, description?: string): string {
    const text = `${name} ${description || ''}`.toLowerCase();

    for (const [keyword, category] of Object.entries(categoryMap)) {
        if (text.includes(keyword)) {
            return category;
        }
    }

    return 'Instrument'; // default fallback
}

async function seedSettings(): Promise<void> {
    console.log("📊 Seeding settings...");

    const dataDir = path.join(process.cwd(), "data");
    const settingsData = fs.readFileSync(path.join(dataDir, "settings.csv"), "utf-8");
    const settingsRecords = parse(settingsData, {
        columns: true,
        skip_empty_lines: true
    });

    for (const record of settingsRecords) {
        await db.insert(settings).values({
            bin: record.company_bin || record.bin || "004223577-0205",
            taxpayerName: record.company_name || record.taxpayer_name || "M S RAHMAN TRADERS",
            address: record.company_address || record.address || "174. Siddique Bazar, Dhaka",
            vatRateDefault: record.vat_rate || "0.15",
            currency: record.currency_code || "BDT",
            testsPerKitDefault: parseInt(record.tests_per_kit_default) || 120,
            simpleChalanThreshold: record.simple_chalan_threshold || "200000"
        }).onConflictDoNothing();
    }
}

async function seedProducts(): Promise<void> {
    console.log("📦 Seeding products...");

    const dataDir = path.join(process.cwd(), "data");
    const productsData = fs.readFileSync(path.join(dataDir, "products.csv"), "utf-8");
    const productsRecords = parse(productsData, {
        columns: true,
        skip_empty_lines: true
    });

    for (const record of productsRecords) {
        if (record.Product && record.Product.trim()) {
            const category = detectCategory(record.Product, record.Category);

            const [product] = await db.insert(products).values({
                sku: record.SKU || null,
                name: record.Product,
                hsCode: record["HS Code"] || null,
                category: category as any,
                unit: record.Unit || (category === 'Footwear' ? 'CTN' : category === 'Fan' ? 'Pc' : 'Pc'),
                testsPerKit: category === 'BioShield' ? (parseInt(record["Tests Per Kit"]) || 120) : null,
                costExVat: record["Per-unit Cost (Tk)"] || "0",
                sellExVat: record["Ex-VAT Selling Price (Tk)"] || "0"
            }).returning({ id: products.id }).onConflictDoNothing();

            // Add opening stock if available
            if (product && record["Qty (Stock In)"]) {
                await db.insert(stockLedger).values({
                    dt: new Date('2021-11-01'), // Start of business
                    productId: product.id,
                    refType: 'OPENING',
                    refNo: 'OPENING-STOCK',
                    qtyIn: record["Qty (Stock In)"],
                    qtyOut: "0",
                    unitCostExVat: record["Per-unit Cost (Tk)"] || "0"
                });
            }
        }
    }
}

async function seedImports(): Promise<void> {
    console.log("📋 Seeding imports...");

    const dataDir = path.join(process.cwd(), "data");
    const importsData = fs.readFileSync(path.join(dataDir, "imports_boe.csv"), "utf-8");
    const importsRecords = parse(importsData, {
        columns: true,
        skip_empty_lines: true
    });

    for (const record of importsRecords) {
        if (record["BoE No"] && record["BoE No"].trim()) {
            await db.insert(importsBoe).values({
                boeNo: record["BoE No"],
                boeDate: new Date(record["BoE Date"]),
                officeCode: record.Office || null,
                itemNo: record["Item No"] || "1",
                hsCode: record.HS || null,
                description: record["Goods Name"] || null,
                assessableValue: record.Assessable || "0",
                baseVat: record.Base || "0",
                sd: record.SD || "0",
                vat: record.VAT || "0",
                at: record.AT || "0",
                qty: record.Qty || "0",
                unit: record["Qty Unit"] || null,
                weightNet: record["Weight Net"] || null,
                weightGross: record["Weight Gross"] || null,
                notes: null
            }).onConflictDoNothing();
        }
    }
}

async function seedTreasuryChallans(): Promise<void> {
    console.log("🏦 Seeding treasury challans...");

    const dataDir = path.join(process.cwd(), "data");
    const challansData = fs.readFileSync(path.join(dataDir, "treasury_challans.csv"), "utf-8");
    const challansRecords = parse(challansData, {
        columns: true,
        skip_empty_lines: true
    });

    for (const record of challansRecords) {
        const challanDate = new Date(record.Date);

        await db.insert(treasuryChallans).values({
            voucherNo: record["Challan/Token No"] || null,
            tokenNo: record["Challan/Token No"],
            bank: record.Bank,
            branch: record.Branch,
            date: challanDate,
            accountCode: record["Account Code"],
            amountBdt: record["Amount (Tk)"],
            periodYear: challanDate.getFullYear(),
            periodMonth: challanDate.getMonth() + 1
        }).onConflictDoNothing();
    }
}

async function seedClosingBalance(): Promise<void> {
    console.log("💰 Seeding closing balance...");

    const dataDir = path.join(process.cwd(), "data");

    try {
        const closingData = fs.readFileSync(path.join(dataDir, "closing_balance_opening.csv"), "utf-8");
        const closingRecords = parse(closingData, {
            columns: true,
            skip_empty_lines: true
        });

        for (const record of closingRecords) {
            await db.insert(closingBalance).values({
                periodYear: parseInt(record.year) || 2025,
                periodMonth: parseInt(record.month) || 10,
                amountBdt: record.amount || "0"
            }).onConflictDoNothing();
        }
    } catch (error) {
        // Initialize with default if file doesn't exist
        await db.insert(closingBalance).values({
            periodYear: 2025,
            periodMonth: 10,
            amountBdt: "0"
        }).onConflictDoNothing();
    }
}

async function seedDatabase() {
    console.log("🌱 Starting production database seeding...");

    try {
        await seedSettings();
        await seedProducts();
        await seedImports();
        await seedTreasuryChallans();
        await seedClosingBalance();

        console.log("✅ Production database seeding completed successfully!");

        console.log(`\n🎯 Ready for production use!`);
        console.log(`   Visit http://localhost:3001 to see the dashboard`);

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();