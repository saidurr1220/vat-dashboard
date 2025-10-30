import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

interface KiroProduct {
    product: string;
    hs_code?: string;
    sku?: string;
    category?: string;
    unit?: string;
    ex_vat_price?: string;
    base_price?: string;
    vat_rate?: string;
}

interface KiroStockLot {
    boe_no: string;
    boe_item: string;
    product: string;
    boe_date: string;
    qty_received: string;
    unit_cost: string;
    pairs_final?: string; // For footwear
}

interface KiroStockOnHand {
    boe_no: string;
    boe_date: string;
    product: string;
    current_balance: string;
    pairs_final?: string; // For footwear
}

interface KiroVatChallan {
    date: string;
    challan_no: string;
    amount: string;
    bank?: string;
    branch?: string;
    account_code?: string;
}

interface KiroTreasuryPlan {
    month: string;
    year: string;
    planned_amount: string;
    account_code: string;
}

// Category mapping for products
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

function detectCategory(productName: string): string {
    const text = productName.toLowerCase();

    for (const [keyword, category] of Object.entries(categoryMap)) {
        if (text.includes(keyword)) {
            return category;
        }
    }

    return 'Instrument'; // default fallback
}

function isFootwear(category: string): boolean {
    return category === 'Footwear';
}

async function loadKiroData() {
    console.log("🌱 Starting Kiro data loading...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const dataDir = path.join(process.cwd(), "data");

    try {
        // 1. Load Products from kiro_products.csv
        console.log("📦 Loading products from kiro_products.csv...");

        const productsPath = path.join(dataDir, "kiro_products.csv");
        if (!fs.existsSync(productsPath)) {
            console.log("⚠️  kiro_products.csv not found, skipping products...");
        } else {
            const productsData = fs.readFileSync(productsPath, "utf-8");
            const productsRecords: KiroProduct[] = parse(productsData, {
                columns: true,
                skip_empty_lines: true
            });

            for (const product of productsRecords) {
                if (product.product) {
                    const category = product.category || detectCategory(product.product);
                    const defaultVatRate = product.vat_rate || "0.15";

                    await pool.query(`
            INSERT INTO products (sku, name, hs_code, category, unit, cost_ex_vat, sell_ex_vat)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (name, hs_code) DO UPDATE SET
              sku = EXCLUDED.sku,
              category = EXCLUDED.category,
              unit = EXCLUDED.unit,
              cost_ex_vat = EXCLUDED.cost_ex_vat,
              sell_ex_vat = EXCLUDED.sell_ex_vat,
              updated_at = NOW()
          `, [
                        product.sku || null,
                        product.product,
                        product.hs_code || null,
                        category,
                        product.unit || (category === 'Footwear' ? 'Pairs' : 'Pc'),
                        product.base_price || "0",
                        product.ex_vat_price || "0"
                    ]);
                }
            }
            console.log(`✅ Loaded ${productsRecords.length} products`);
        }

        // 2. Load Stock Lots from kiro_stock_lots.csv
        console.log("📋 Loading stock lots from kiro_stock_lots.csv...");

        const stockLotsPath = path.join(dataDir, "kiro_stock_lots.csv");
        if (!fs.existsSync(stockLotsPath)) {
            console.log("⚠️  kiro_stock_lots.csv not found, skipping stock lots...");
        } else {
            const stockLotsData = fs.readFileSync(stockLotsPath, "utf-8");
            const stockLotsRecords: KiroStockLot[] = parse(stockLotsData, {
                columns: true,
                skip_empty_lines: true
            });

            for (const lot of stockLotsRecords) {
                if (lot.boe_no && lot.product) {
                    // Find matching product
                    const productResult = await pool.query(`
            SELECT id, category FROM products WHERE name ILIKE $1 LIMIT 1
          `, [lot.product]);

                    if (productResult.rows.length > 0) {
                        const product = productResult.rows[0];
                        const isFootwearProduct = product.category === 'Footwear';

                        // For footwear, use pairs_final; otherwise use qty_received
                        const quantity = isFootwearProduct && lot.pairs_final
                            ? lot.pairs_final
                            : lot.qty_received;

                        // Add stock ledger entry for the lot
                        await pool.query(`
              INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT DO NOTHING
            `, [
                            new Date(lot.boe_date),
                            product.id,
                            'IMPORT',
                            `${lot.boe_no}-${lot.boe_item}`,
                            quantity || "0",
                            "0",
                            lot.unit_cost || "0"
                        ]);

                        // Also add to imports_boe table
                        await pool.query(`
              INSERT INTO imports_boe (boe_no, boe_date, item_no, description, qty, unit, assessable_value)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (boe_no, item_no) DO UPDATE SET
                description = EXCLUDED.description,
                qty = EXCLUDED.qty,
                unit = EXCLUDED.unit,
                assessable_value = EXCLUDED.assessable_value
            `, [
                            lot.boe_no,
                            new Date(lot.boe_date),
                            lot.boe_item || "1",
                            lot.product,
                            quantity || "0",
                            isFootwearProduct ? 'Pairs' : 'Pc',
                            (Number(quantity || 0) * Number(lot.unit_cost || 0)).toString()
                        ]);
                    }
                }
            }
            console.log(`✅ Loaded ${stockLotsRecords.length} stock lots`);
        }

        // 3. Reconcile Current Stock from kiro_stock_on_hand.csv
        console.log("📊 Reconciling current stock from kiro_stock_on_hand.csv...");

        const stockOnHandPath = path.join(dataDir, "kiro_stock_on_hand.csv");
        if (!fs.existsSync(stockOnHandPath)) {
            console.log("⚠️  kiro_stock_on_hand.csv not found, skipping stock reconciliation...");
        } else {
            const stockOnHandData = fs.readFileSync(stockOnHandPath, "utf-8");
            const stockOnHandRecords: KiroStockOnHand[] = parse(stockOnHandData, {
                columns: true,
                skip_empty_lines: true
            });

            // Group by product and reconcile
            const stockByProduct = new Map<string, number>();

            for (const stock of stockOnHandRecords) {
                if (stock.product && stock.current_balance) {
                    const productResult = await pool.query(`
            SELECT id, category FROM products WHERE name ILIKE $1 LIMIT 1
          `, [stock.product]);

                    if (productResult.rows.length > 0) {
                        const product = productResult.rows[0];
                        const isFootwearProduct = product.category === 'Footwear';

                        // For footwear, use pairs_final; otherwise use current_balance
                        const currentBalance = isFootwearProduct && stock.pairs_final
                            ? Number(stock.pairs_final)
                            : Number(stock.current_balance);

                        stockByProduct.set(stock.product, currentBalance);
                    }
                }
            }

            // Add adjustment entries to match current stock
            for (const [productName, targetBalance] of stockByProduct) {
                const productResult = await pool.query(`
          SELECT id FROM products WHERE name ILIKE $1 LIMIT 1
        `, [productName]);

                if (productResult.rows.length > 0) {
                    const productId = productResult.rows[0].id;

                    // Calculate current stock from ledger
                    const stockResult = await pool.query(`
            SELECT COALESCE(SUM(qty_in::numeric) - SUM(qty_out::numeric), 0) as current_stock
            FROM stock_ledger WHERE product_id = $1
          `, [productId]);

                    const currentStock = Number(stockResult.rows[0].current_stock);
                    const adjustment = targetBalance - currentStock;

                    if (Math.abs(adjustment) > 0.01) { // Only adjust if significant difference
                        await pool.query(`
              INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                            new Date(),
                            productId,
                            'ADJUST',
                            'STOCK-RECONCILIATION',
                            adjustment > 0 ? adjustment.toString() : "0",
                            adjustment < 0 ? Math.abs(adjustment).toString() : "0",
                            "0"
                        ]);
                    }
                }
            }
            console.log(`✅ Reconciled stock for ${stockByProduct.size} products`);
        }

        // 4. Load VAT Challans from kiro_vat_challans.csv
        console.log("🏦 Loading VAT challans from kiro_vat_challans.csv...");

        const vatChallansPath = path.join(dataDir, "kiro_vat_challans.csv");
        if (!fs.existsSync(vatChallansPath)) {
            console.log("⚠️  kiro_vat_challans.csv not found, skipping VAT challans...");
        } else {
            const vatChallansData = fs.readFileSync(vatChallansPath, "utf-8");
            const vatChallansRecords: KiroVatChallan[] = parse(vatChallansData, {
                columns: true,
                skip_empty_lines: true
            });

            // Sort by date ascending as requested
            vatChallansRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            for (const challan of vatChallansRecords) {
                if (challan.date && challan.amount) {
                    const challanDate = new Date(challan.date);

                    await pool.query(`
            INSERT INTO treasury_challans (voucher_no, token_no, bank, branch, date, account_code, amount_bdt, period_year, period_month)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (voucher_no) DO UPDATE SET
              token_no = EXCLUDED.token_no,
              bank = EXCLUDED.bank,
              branch = EXCLUDED.branch,
              date = EXCLUDED.date,
              account_code = EXCLUDED.account_code,
              amount_bdt = EXCLUDED.amount_bdt,
              period_year = EXCLUDED.period_year,
              period_month = EXCLUDED.period_month
          `, [
                        challan.challan_no,
                        challan.challan_no,
                        challan.bank || "Unknown Bank",
                        challan.branch || "Main Branch",
                        challanDate,
                        challan.account_code || "1/1143/0016/0311",
                        challan.amount,
                        challanDate.getFullYear(),
                        challanDate.getMonth() + 1
                    ]);
                }
            }
            console.log(`✅ Loaded ${vatChallansRecords.length} VAT challans`);
        }

        // 5. Load Treasury Metadata and Plan
        console.log("💰 Loading treasury metadata and plan...");

        const metaPath = path.join(dataDir, "kiro_meta.json");
        const treasuryPlanPath = path.join(dataDir, "kiro_treasury_plan.csv");

        if (fs.existsSync(metaPath)) {
            const metaData = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

            // Update settings with metadata
            await pool.query(`
        UPDATE settings SET
          bin = $1,
          taxpayer_name = $2,
          address = $3,
          vat_rate_default = $4,
          updated_at = NOW()
        WHERE id = (SELECT MIN(id) FROM settings)
      `, [
                metaData.bin || "004223577-0205",
                metaData.company_name || "M S RAHMAN TRADERS",
                metaData.address || "174. Siddique Bazar, Dhaka",
                metaData.vat_rate || "0.15"
            ]);
        }

        if (fs.existsSync(treasuryPlanPath)) {
            const treasuryPlanData = fs.readFileSync(treasuryPlanPath, "utf-8");
            const treasuryPlanRecords: KiroTreasuryPlan[] = parse(treasuryPlanData, {
                columns: true,
                skip_empty_lines: true
            });

            for (const plan of treasuryPlanRecords) {
                if (plan.year && plan.month && plan.planned_amount) {
                    // This could be used for future planning - store in a separate table or notes
                    console.log(`Treasury plan: ${plan.year}-${plan.month} = ৳${plan.planned_amount}`);
                }
            }
        }

        console.log("✅ Kiro data loading completed successfully!");

        // Show summary
        const productCount = await pool.query('SELECT COUNT(*) FROM products');
        const stockCount = await pool.query('SELECT COUNT(*) FROM stock_ledger');
        const importCount = await pool.query('SELECT COUNT(*) FROM imports_boe');
        const challanCount = await pool.query('SELECT COUNT(*) FROM treasury_challans');

        console.log(`\n📊 Final Summary:`);
        console.log(`   Products: ${productCount.rows[0].count}`);
        console.log(`   Stock Entries: ${stockCount.rows[0].count}`);
        console.log(`   Import Records: ${importCount.rows[0].count}`);
        console.log(`   Treasury Challans: ${challanCount.rows[0].count}`);
        console.log(`\n🎯 Kiro data successfully loaded!`);

    } catch (error) {
        console.error("❌ Error loading Kiro data:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

loadKiroData();