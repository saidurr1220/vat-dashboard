import { db } from "../src/db/client";
import { settings, products, importEntries, treasuryChallans, closingBalance } from "../src/db/schema";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedDatabase() {
    console.log("🌱 Starting database seeding...");

    try {
        // Read and parse CSV files
        const dataDir = path.join(process.cwd(), "data");

        // Seed settings
        console.log("📊 Seeding settings...");
        const settingsData = fs.readFileSync(path.join(dataDir, "settings.csv"), "utf-8");
        const settingsRecords = parse(settingsData, {
            columns: true,
            skip_empty_lines: true
        });

        for (const record of settingsRecords) {
            await db.insert(settings).values({
                currencyCode: record.currency_code,
                vatRate: record.vat_rate,
                testsPerKitDefault: parseInt(record.tests_per_kit_default),
                simpleChalanThreshold: record.simple_chalan_threshold,
                companyBin: record.company_bin,
                companyName: record.company_name,
                companyAddress: record.company_address,
                ownership: record.ownership,
                activity: record.activity,
            }).onConflictDoNothing();
        }

        // Seed products (if any data exists)
        console.log("📦 Seeding products...");
        const productsData = fs.readFileSync(path.join(dataDir, "products.csv"), "utf-8");
        const productsRecords = parse(productsData, {
            columns: true,
            skip_empty_lines: true
        });

        for (const record of productsRecords) {
            if (record.Product && record.Product.trim()) {
                await db.insert(products).values({
                    category: record.Category || null,
                    name: record.Product,
                    hsCode: record["HS Code"] || null,
                    unit: record.Unit || "Pc",
                    qtyStockIn: record["Qty (Stock In)"] || "0",
                    costExVat: record["Per-unit Cost (Tk)"] || "0",
                    sellExVat: record["Ex-VAT Selling Price (Tk)"] || "0",
                    boeSource: record["Source BoE"] || null,
                    boeDates: record["BoE Dates"] || null,
                }).onConflictDoNothing();
            }
        }

        // Seed import entries (if any data exists)
        console.log("📋 Seeding import entries...");
        const importsData = fs.readFileSync(path.join(dataDir, "imports_boe.csv"), "utf-8");
        const importsRecords = parse(importsData, {
            columns: true,
            skip_empty_lines: true
        });

        for (const record of importsRecords) {
            if (record["BoE No"] && record["BoE No"].trim()) {
                await db.insert(importEntries).values({
                    boeNo: record["BoE No"],
                    boeDate: new Date(record["BoE Date"]),
                    office: record.Office || null,
                    itemNo: record["Item No"] || null,
                    cpc: record.CPC || null,
                    hs: record.HS || null,
                    goodsName: record["Goods Name"] || null,
                    assessable: record.Assessable || "0",
                    base: record.Base || "0",
                    sd: record.SD || "0",
                    vat: record.VAT || "0",
                    at: record.AT || "0",
                    qty: record.Qty || "0",
                    qtyUnit: record["Qty Unit"] || null,
                    qtyPc: record["Qty (Pc)"] || "0",
                    unitNormalized: record["Unit (consistent)"] || null,
                }).onConflictDoNothing();
            }
        }

        // Seed treasury challans
        console.log("🏦 Seeding treasury challans...");
        const challansData = fs.readFileSync(path.join(dataDir, "treasury_challans.csv"), "utf-8");
        const challansRecords = parse(challansData, {
            columns: true,
            skip_empty_lines: true
        });

        for (const record of challansRecords) {
            await db.insert(treasuryChallans).values({
                tokenNo: record["Challan/Token No"],
                bank: record.Bank,
                branch: record.Branch,
                date: new Date(record.Date),
                accountCode: record["Account Code"],
                amountBdt: record["Amount (Tk)"],
                notes: record.Notes || null,
            }).onConflictDoNothing();
        }

        // Initialize closing balance for current period (Oct 2025)
        console.log("💰 Initializing closing balance...");
        await db.insert(closingBalance).values({
            periodYear: 2025,
            periodMonth: 10,
            amountBdt: "0", // Start with 0, can be configured later
        }).onConflictDoNothing();

        console.log("✅ Database seeding completed successfully!");

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();