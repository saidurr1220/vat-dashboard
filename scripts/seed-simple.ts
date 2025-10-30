import { Pool } from "pg";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedDatabase() {
    console.log("🌱 Starting simple database seeding...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
            if (record.company_name && record.company_name.trim()) {
                await pool.query(`
          INSERT INTO settings (currency_code, vat_rate, tests_per_kit_default, simple_chalan_threshold, company_bin, company_name, company_address, ownership, activity)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `, [
                    record.currency_code || "BDT",
                    parseFloat(record.vat_rate) || 0.15,
                    parseInt(record.tests_per_kit_default) || 120,
                    parseFloat(record.simple_chalan_threshold) || 200000,
                    record.company_bin,
                    record.company_name,
                    record.company_address,
                    record.ownership,
                    record.activity
                ]);
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
            if (record["Challan/Token No"] && record["Challan/Token No"].trim()) {
                await pool.query(`
          INSERT INTO treasury_challans (token_no, bank, branch, date, account_code, amount_bdt, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING
        `, [
                    record["Challan/Token No"],
                    record.Bank,
                    record.Branch,
                    new Date(record.Date),
                    record["Account Code"],
                    parseFloat(record["Amount (Tk)"]),
                    record.Notes || null
                ]);
            }
        }

        // Initialize closing balance for current period (Oct 2025)
        console.log("💰 Initializing closing balance...");
        await pool.query(`
      INSERT INTO closing_balance (period_year, period_month, amount_bdt)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [2025, 10, 0]);

        console.log("✅ Database seeding completed successfully!");

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seedDatabase();