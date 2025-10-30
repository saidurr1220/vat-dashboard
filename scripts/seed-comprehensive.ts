import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
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
    'covid': 'BioShield',
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

function readExcelFile(filePath: string): any[] {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
        console.log(`Could not read Excel file ${filePath}:`, error);
        return [];
    }
}

async function seedComprehensiveData() {
    console.log("🌱 Starting comprehensive database seeding...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const dataDir = path.join(process.cwd(), "data");

    try {
        // 1. Seed Settings
        console.log("📊 Seeding settings...");
        await pool.query(`
      INSERT INTO settings (bin, taxpayer_name, address, vat_rate_default, currency, tests_per_kit_default, simple_chalan_threshold)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [
            "004223577-0205",
            "M S RAHMAN TRADERS",
            "174. Siddique Bazar, Dhaka; Bangshal PS; Dhaka - 1000; Bangladesh",
            "0.15",
            "BDT",
            120,
            "200000"
        ]);

        // 2. Seed Products from CSV
        console.log("📦 Seeding products from CSV...");
        const productsData = fs.readFileSync(path.join(dataDir, "products.csv"), "utf-8");
        const productsRecords = parse(productsData, {
            columns: true,
            skip_empty_lines: true
        });

        // Add sample products if CSV is empty
        const sampleProducts = [
            {
                sku: "BS-COVID-001",
                name: "BioShield COVID-19 Test Kit",
                hsCode: "90279050",
                category: "BioShield",
                unit: "Kit",
                testsPerKit: 120,
                costExVat: "5000",
                sellExVat: "6000"
            },
            {
                sku: "FAN-CEIL-001",
                name: "Ceiling Fan Complete Set",
                hsCode: "84145100",
                category: "Fan",
                unit: "Pc",
                testsPerKit: null,
                costExVat: "2500",
                sellExVat: "3500"
            },
            {
                sku: "SHOE-SPORT-001",
                name: "Sports Shoes Carton",
                hsCode: "64041100",
                category: "Footwear",
                unit: "CTN",
                testsPerKit: null,
                costExVat: "8000",
                sellExVat: "12000"
            },
            {
                sku: "SHOE-CASUAL-001",
                name: "Casual Shoes Carton",
                hsCode: "64041100",
                category: "Footwear",
                unit: "CTN",
                testsPerKit: null,
                costExVat: "6000",
                sellExVat: "9000"
            },
            {
                sku: "FAN-EXHAUST-001",
                name: "Exhaust Fan Set",
                hsCode: "84145900",
                category: "Fan",
                unit: "Pc",
                testsPerKit: null,
                costExVat: "1500",
                sellExVat: "2200"
            },
            {
                sku: "BS-REAGENT-001",
                name: "BioShield Reagent Kit",
                hsCode: "38220090",
                category: "BioShield",
                unit: "Kit",
                testsPerKit: 200,
                costExVat: "8000",
                sellExVat: "10000"
            }
        ];

        const allProducts = productsRecords.length > 0 ? productsRecords : sampleProducts;

        for (const product of allProducts) {
            if (product.name || product.Product) {
                const productName = product.name || product.Product;
                const category = product.category || detectCategory(productName);

                const result = await pool.query(`
          INSERT INTO products (sku, name, hs_code, category, unit, tests_per_kit, cost_ex_vat, sell_ex_vat)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
          ON CONFLICT DO NOTHING
        `, [
                    product.sku || product.SKU || null,
                    productName,
                    product.hsCode || product["HS Code"] || null,
                    category,
                    product.unit || product.Unit || (category === 'Footwear' ? 'CTN' : category === 'Fan' ? 'Pc' : 'Pc'),
                    product.testsPerKit || (category === 'BioShield' ? (parseInt(product["Tests Per Kit"]) || 120) : null),
                    product.costExVat || product["Per-unit Cost (Tk)"] || "0",
                    product.sellExVat || product["Ex-VAT Selling Price (Tk)"] || "0"
                ]);
            }
        }

        // 3. Add Opening Stock
        console.log("📋 Adding opening stock entries...");
        const products = await pool.query('SELECT id, name, category FROM products ORDER BY id');

        const openingStockAmounts = {
            'BioShield': 50,
            'Fan': 100,
            'Footwear': 200,
            'Instrument': 25
        };

        for (const product of products.rows) {
            const stockAmount = openingStockAmounts[product.category as keyof typeof openingStockAmounts] || 50;

            await pool.query(`
        INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
                new Date('2021-11-01'),
                product.id,
                'OPENING',
                'OPENING-STOCK',
                stockAmount.toString(),
                "0",
                "0"
            ]);
        }

        // 4. Seed Imports from BoE
        console.log("📋 Seeding imports from BoE...");
        const importsData = fs.readFileSync(path.join(dataDir, "imports_boe.csv"), "utf-8");
        const importsRecords = parse(importsData, {
            columns: true,
            skip_empty_lines: true
        });

        // Add sample imports if CSV is empty
        const sampleImports = [
            {
                boeNo: "BOE-2025-001",
                boeDate: "2025-01-15",
                officeCode: "DHK-001",
                itemNo: "1",
                hsCode: "90279050",
                description: "COVID-19 Test Kits",
                assessableValue: "500000",
                baseVat: "75000",
                sd: "0",
                vat: "86250",
                at: "0",
                qty: "100",
                unit: "Kit"
            },
            {
                boeNo: "BOE-2025-002",
                boeDate: "2025-02-20",
                officeCode: "DHK-001",
                itemNo: "1",
                hsCode: "84145100",
                description: "Ceiling Fans",
                assessableValue: "300000",
                baseVat: "45000",
                sd: "0",
                vat: "51750",
                at: "0",
                qty: "120",
                unit: "Pc"
            }
        ];

        const allImports = importsRecords.length > 0 ? importsRecords : sampleImports;

        for (const record of allImports) {
            if (record.boeNo || record["BoE No"]) {
                await pool.query(`
          INSERT INTO imports_boe (boe_no, boe_date, office_code, item_no, hs_code, description, assessable_value, base_vat, sd, vat, at, qty, unit)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT DO NOTHING
        `, [
                    record.boeNo || record["BoE No"],
                    new Date(record.boeDate || record["BoE Date"]),
                    record.officeCode || record.Office || null,
                    record.itemNo || record["Item No"] || "1",
                    record.hsCode || record.HS || null,
                    record.description || record["Goods Name"] || null,
                    record.assessableValue || record.Assessable || "0",
                    record.baseVat || record.Base || "0",
                    record.sd || record.SD || "0",
                    record.vat || record.VAT || "0",
                    record.at || record.AT || "0",
                    record.qty || record.Qty || "0",
                    record.unit || record["Qty Unit"] || null
                ]);
            }
        }

        // 5. Seed Sales from Excel/CSV
        console.log("💰 Seeding sales data...");

        // Try to read Excel file first
        let salesData = [];
        const excelPath = path.join(dataDir, "Sales_Challan_TotalVAT_v2.xlsx");
        if (fs.existsSync(excelPath)) {
            salesData = readExcelFile(excelPath);
        }

        // Fallback to CSV template
        if (salesData.length === 0) {
            const csvPath = path.join(dataDir, "sales_register_template.csv");
            if (fs.existsSync(csvPath)) {
                const csvData = fs.readFileSync(csvPath, "utf-8");
                salesData = parse(csvData, {
                    columns: true,
                    skip_empty_lines: true
                });
            }
        }

        // Add sample sales if no data
        if (salesData.length === 0) {
            salesData = [
                {
                    sale_date: "2025-10-15",
                    invoice_no: "INV-001",
                    customer: "ABC Medical Center",
                    category: "BioShield",
                    product: "BioShield COVID-19 Test Kit",
                    unit: "Kit",
                    qty: "2",
                    unit_price_entered: "11500",
                    amount_type: "INCL"
                },
                {
                    sale_date: "2025-10-20",
                    invoice_no: "INV-002",
                    customer: "XYZ Electronics",
                    category: "Fan",
                    product: "Ceiling Fan Complete Set",
                    unit: "Pc",
                    qty: "3",
                    unit_price_entered: "3500",
                    amount_type: "EXCL"
                },
                {
                    sale_date: "2025-10-25",
                    invoice_no: "INV-003",
                    customer: "Fashion Store Ltd",
                    category: "Footwear",
                    product: "Sports Shoes Carton",
                    unit: "CTN",
                    qty: "5",
                    unit_price_entered: "12000",
                    amount_type: "EXCL"
                }
            ];
        }

        for (const sale of salesData) {
            if (sale.invoice_no) {
                const totalValue = Number(sale.qty || 1) * Number(sale.unit_price_entered || 0);

                const saleResult = await pool.query(`
          INSERT INTO sales (invoice_no, dt, customer, total_value, amount_type, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
          ON CONFLICT DO NOTHING
        `, [
                    sale.invoice_no,
                    new Date(sale.sale_date),
                    sale.customer,
                    totalValue.toString(),
                    sale.amount_type || 'EXCL',
                    `Sale of ${sale.product || 'products'}`
                ]);

                if (saleResult.rows.length > 0) {
                    // Find matching product
                    const productResult = await pool.query(`
            SELECT id FROM products WHERE name ILIKE $1 LIMIT 1
          `, [`%${sale.product}%`]);

                    if (productResult.rows.length > 0) {
                        await pool.query(`
              INSERT INTO sales_lines (sale_id, product_id, unit, qty, unit_price_value, amount_type, line_total_calc)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT DO NOTHING
            `, [
                            saleResult.rows[0].id,
                            productResult.rows[0].id,
                            sale.unit,
                            sale.qty,
                            sale.unit_price_entered,
                            sale.amount_type || 'EXCL',
                            totalValue.toString()
                        ]);

                        // Add stock out entry
                        await pool.query(`
              INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                            new Date(sale.sale_date),
                            productResult.rows[0].id,
                            'SALE',
                            sale.invoice_no,
                            "0",
                            sale.qty,
                            "0"
                        ]);
                    }
                }
            }
        }

        // 6. Seed Treasury Challans
        console.log("🏦 Seeding treasury challans...");
        const challansData = fs.readFileSync(path.join(dataDir, "treasury_challans.csv"), "utf-8");
        const challansRecords = parse(challansData, {
            columns: true,
            skip_empty_lines: true
        });

        const sampleChallans = [
            {
                voucherNo: "CH-2025-001",
                tokenNo: "TK-001",
                bank: "Sonali Bank",
                branch: "Dhaka Main",
                date: "2025-09-15",
                accountCode: "1/1143/0016/0311",
                amountBdt: "50000",
                periodYear: 2025,
                periodMonth: 9
            },
            {
                voucherNo: "CH-2025-002",
                tokenNo: "TK-002",
                bank: "Janata Bank",
                branch: "Motijheel",
                date: "2025-08-20",
                accountCode: "1/1143/0016/0311",
                amountBdt: "75000",
                periodYear: 2025,
                periodMonth: 8
            }
        ];

        const allChallans = challansRecords.length > 0 ? challansRecords : sampleChallans;

        for (const record of allChallans) {
            const challanDate = new Date(record.date || record.Date);

            await pool.query(`
        INSERT INTO treasury_challans (voucher_no, token_no, bank, branch, date, account_code, amount_bdt, period_year, period_month)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [
                record.voucherNo || record["Challan/Token No"] || null,
                record.tokenNo || record["Challan/Token No"],
                record.bank || record.Bank,
                record.branch || record.Branch,
                challanDate,
                record.accountCode || record["Account Code"],
                record.amountBdt || record["Amount (Tk)"],
                record.periodYear || challanDate.getFullYear(),
                record.periodMonth || challanDate.getMonth() + 1
            ]);
        }

        // 7. Seed Closing Balance
        console.log("💰 Seeding closing balance...");
        await pool.query(`
      INSERT INTO closing_balance (period_year, period_month, amount_bdt)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [
            2025,
            10,
            "125000"
        ]);

        console.log("✅ Comprehensive database seeding completed successfully!");

        // Show summary
        const productCount = await pool.query('SELECT COUNT(*) FROM products');
        const salesCount = await pool.query('SELECT COUNT(*) FROM sales');
        const importCount = await pool.query('SELECT COUNT(*) FROM imports_boe');
        const challanCount = await pool.query('SELECT COUNT(*) FROM treasury_challans');
        const stockCount = await pool.query('SELECT COUNT(*) FROM stock_ledger');

        console.log(`\n📊 Summary:`);
        console.log(`   Products: ${productCount.rows[0].count}`);
        console.log(`   Sales: ${salesCount.rows[0].count}`);
        console.log(`   Imports: ${importCount.rows[0].count}`);
        console.log(`   Treasury Challans: ${challanCount.rows[0].count}`);
        console.log(`   Stock Entries: ${stockCount.rows[0].count}`);
        console.log(`\n🎯 Ready for production use at http://localhost:3000`);

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seedComprehensiveData();