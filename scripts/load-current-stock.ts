import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const stockData = {
    "footwear": [
        {
            "product": "BABY FOOTWEAR",
            "qty_on_hand": 50940,
            "price_ex_vat": 226.0363,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BABY FOOTWEAR SZ 25-30 G.B NM",
            "qty_on_hand": 12660,
            "price_ex_vat": 208.558,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BABY FOOTWEAR SZ 26-31 G.B FASHION",
            "qty_on_hand": 95700,
            "price_ex_vat": 208.558,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOY'S GIRLS SANDLE SZ 32-36 G.B FASHION",
            "qty_on_hand": 2760,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOYS & GIRLS SANDEL",
            "qty_on_hand": 2520,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOYS GIRLS SANDLE SZ 32-36 G.B FASHION",
            "qty_on_hand": 7920,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOYS KEDS",
            "qty_on_hand": 1380,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOYS KEDS SZ 31-36 G.B FASHION",
            "qty_on_hand": 10980,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOYS KEDS SZ 32-36 G.B FASHION",
            "qty_on_hand": 7440,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOYS SANDEL",
            "qty_on_hand": 4080,
            "price_ex_vat": 310.7708,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "BOYS SANDLE SZ 31-36 G.B FASHION",
            "qty_on_hand": 1740,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "Boys (Others Footwear)",
            "qty_on_hand": 3600,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "GIRLS SANDLE SZ 32-36 G. B FASHION",
            "qty_on_hand": 4920,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "LADIES KEDS",
            "qty_on_hand": 9930,
            "price_ex_vat": 417.116,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "LADIES KEDS SZ 37-41 G. B FASHION",
            "qty_on_hand": 7740,
            "price_ex_vat": 417.116,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "LADIES KEDS SZ 37-41 G.B FASHION",
            "qty_on_hand": 8070,
            "price_ex_vat": 417.116,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "LADIES KEDS SZ 37-41 G.B NM",
            "qty_on_hand": 9630,
            "price_ex_vat": 417.116,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "LADIES SANDEL",
            "qty_on_hand": 9450,
            "price_ex_vat": 452.0589000000001,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "MENS KEDS",
            "qty_on_hand": 6570,
            "price_ex_vat": 847.5779,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "MENS KEDS SZ 39-44 G.B FASHION",
            "qty_on_hand": 29820,
            "price_ex_vat": 782.1099999999999,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "MENS KEDS SZ 39-44 G.B NM",
            "qty_on_hand": 5970,
            "price_ex_vat": 782.1099999999999,
            "unit": "Pair",
            "category": "Footwear"
        },
        {
            "product": "OTHER FOOTWEAR (BOYS & GIRLS SANDEL)",
            "qty_on_hand": 6240,
            "price_ex_vat": 286.79,
            "unit": "Pair",
            "category": "Footwear"
        }
    ],
    "bioshield": [
        {
            "product": "Bio-Shield DON M.E.96 (Lot B3896045) – Reagent",
            "category": "BioShield",
            "unit": "Test",
            "price_ex_vat": 273.6,
            "qty_on_hand": 1340,
            "qty_on_hand_existing": 500,
            "packages": 7,
            "qty_from_packages": 840
        },
        {
            "product": "Bio-Shield Fumonisin-5",
            "category": "BioShield",
            "unit": "Test",
            "price_ex_vat": 273.62,
            "qty_on_hand": 120,
            "qty_on_hand_existing": 0,
            "packages": 1,
            "qty_from_packages": 120
        },
        {
            "product": "Bio-Shield OCHRATOXIN 896 (Lot B5496027) – Reagent",
            "category": "BioShield",
            "unit": "Test",
            "price_ex_vat": 273.62,
            "qty_on_hand": 860,
            "qty_on_hand_existing": 500,
            "packages": 3,
            "qty_from_packages": 360
        },
        {
            "product": "Bio-Shield T-2",
            "category": "BioShield",
            "unit": "Test",
            "price_ex_vat": 273.62,
            "qty_on_hand": 120,
            "qty_on_hand_existing": 0,
            "packages": 1,
            "qty_from_packages": 120
        },
        {
            "product": "Bio-Shield TOTAL 596 (Lot B5196059) – Reagent",
            "category": "BioShield",
            "unit": "Test",
            "price_ex_vat": 273.62,
            "qty_on_hand": 3120,
            "qty_on_hand_existing": 3000,
            "packages": 1,
            "qty_from_packages": 120
        },
        {
            "product": "Bio-Shield ZON-5",
            "category": "BioShield",
            "unit": "Test",
            "price_ex_vat": 273.6,
            "qty_on_hand": 240,
            "qty_on_hand_existing": 0,
            "packages": 2,
            "qty_from_packages": 240
        }
    ],
    "fan": [
        {
            "product": "Fan (Imported)",
            "qty_on_hand": 2002,
            "price_ex_vat": 1899.0,
            "unit": "Pc",
            "category": "Fan"
        }
    ],
    "absorbance": [
        {
            "product": "Absorbance 96 microplate reader",
            "qty_on_hand": 1,
            "price_ex_vat": 524815.2,
            "unit": "Pc",
            "category": "Instrument"
        }
    ]
};

async function loadCurrentStock() {
    console.log("🔄 Loading current stock data...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Clear existing data
        console.log("🗑️ Clearing existing data...");
        await pool.query('DELETE FROM stock_ledger');
        await pool.query('DELETE FROM sales_lines');
        await pool.query('DELETE FROM sales');
        await pool.query('DELETE FROM products');

        // Reset sequences
        await pool.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE stock_ledger_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE sales_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE sales_lines_id_seq RESTART WITH 1');

        // Process all categories
        const allItems = [
            ...stockData.footwear,
            ...stockData.bioshield,
            ...stockData.fan,
            ...stockData.absorbance
        ];

        console.log(`📦 Processing ${allItems.length} products...`);

        for (const item of allItems) {
            // Insert product
            const productResult = await pool.query(`
        INSERT INTO products (name, category, unit, cost_ex_vat, sell_ex_vat)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
                item.product,
                item.category,
                item.unit,
                item.price_ex_vat.toString(),
                (item.price_ex_vat * 1.2).toString() // 20% markup for selling price
            ]);

            const productId = productResult.rows[0].id;

            // Insert opening stock
            if (item.qty_on_hand > 0) {
                await pool.query(`
          INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
                    new Date('2025-01-01'), // Opening stock date
                    productId,
                    'OPENING',
                    'OPENING-STOCK',
                    item.qty_on_hand.toString(),
                    '0',
                    item.price_ex_vat.toString()
                ]);
            }

            console.log(`✅ Added: ${item.product} - ${item.qty_on_hand} ${item.unit}`);
        }

        // Show summary
        const productCount = await pool.query('SELECT COUNT(*) FROM products');
        const stockCount = await pool.query('SELECT COUNT(*) FROM stock_ledger');

        // Calculate total stock value
        const stockValue = await pool.query(`
      SELECT 
        SUM(sl.qty_in::numeric * sl.unit_cost_ex_vat::numeric) as total_value
      FROM stock_ledger sl
      WHERE sl.ref_type = 'OPENING'
    `);

        console.log(`\n📊 Stock Loading Summary:`);
        console.log(`   Products: ${productCount.rows[0].count}`);
        console.log(`   Stock Entries: ${stockCount.rows[0].count}`);
        console.log(`   Total Stock Value: ৳${Number(stockValue.rows[0].total_value || 0).toLocaleString()}`);
        console.log(`\n🎯 Current stock data loaded successfully!`);

    } catch (error) {
        console.error("❌ Error loading stock data:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

loadCurrentStock();