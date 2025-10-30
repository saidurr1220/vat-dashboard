import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function restoreFromBackup() {
    console.log('🔄 Restoring data from complete backup...');

    const backupFile = 'complete-local-export.json';

    if (!fs.existsSync(backupFile)) {
        console.error(`❌ ${backupFile} not found. Cannot restore.`);
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        console.log(`📅 Backup created at: ${data.exportedAt}`);
        console.log(`📊 Source: ${data.source}`);

        // Clear existing data first (only if tables exist)
        console.log('🧹 Clearing existing data...');
        const tablesToClear = [
            'closing_balance',
            'sales',
            'customers',
            'products',
            'treasury_challans',
            'vat_ledger'
        ];

        for (const table of tablesToClear) {
            try {
                await db.execute(sql.raw(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`));
                console.log(`✅ Cleared ${table}`);
            } catch (error) {
                console.log(`⚠️ Table ${table} doesn't exist or couldn't be cleared, skipping...`);
            }
        }

        // Restore closing balance
        if (data.closing_balance && data.closing_balance.length > 0) {
            console.log(`🔄 Restoring ${data.closing_balance.length} closing balance entries...`);
            for (const row of data.closing_balance) {
                await db.execute(sql`
                    INSERT INTO closing_balance (
                        period_year, period_month, opening_balance, 
                        current_month_addition, used_amount, closing_balance, notes
                    ) VALUES (
                        ${row.period_year}, ${row.period_month}, ${row.opening_balance || 0},
                        ${row.current_month_addition || 0}, ${row.used_amount || 0}, 
                        ${row.closing_balance || 0}, ${row.notes || ''}
                    )
                `);
            }
        }

        // Restore sales
        if (data.sales && data.sales.length > 0) {
            console.log(`🔄 Restoring ${data.sales.length} sales entries...`);
            for (const row of data.sales) {
                try {
                    await db.execute(sql`
                        INSERT INTO sales (
                            invoice_no, dt, customer, total_value, amount_type
                        ) VALUES (
                            ${row.invoice_no}, ${row.dt}, ${row.customer || row.customer_name || 'Unknown'}, 
                            ${row.total_value || 0}, ${row.amount_type || 'EXCL'}::amount_type
                        )
                    `);
                } catch (error) {
                    console.log(`⚠️ Error restoring sale ${row.invoice_no}:`, error.message);
                }
            }
        }

        // Restore VAT ledger (instead of monthly_sales and vat_computations)
        if (data.vat_computations && data.vat_computations.length > 0) {
            console.log(`🔄 Restoring ${data.vat_computations.length} VAT ledger entries...`);
            for (const row of data.vat_computations) {
                try {
                    await db.execute(sql`
                        INSERT INTO vat_ledger (
                            period_year, period_month, gross_sales, net_sales_ex_vat, 
                            vat_rate, vat_payable, used_from_closing_balance, treasury_needed, locked
                        ) VALUES (
                            ${row.year || row.period_year}, ${row.month || row.period_month}, 
                            ${row.gross_sales || 0}, ${row.net_sales_ex_vat || 0}, 
                            ${row.vat_rate || 0.15}, ${row.vat_payable || 0},
                            ${row.used_from_closing_balance || 0}, ${row.treasury_needed || 0},
                            ${row.locked || false}
                        )
                    `);
                } catch (error) {
                    console.log(`⚠️ Error restoring VAT ledger for ${row.year || row.period_year}-${row.month || row.period_month}:`, error.message);
                }
            }
        }

        // Restore customers
        if (data.customers && data.customers.length > 0) {
            console.log(`🔄 Restoring ${data.customers.length} customer entries...`);
            for (const row of data.customers) {
                try {
                    await db.execute(sql`
                        INSERT INTO customers (
                            name, address, phone, bin, nid
                        ) VALUES (
                            ${row.name}, ${row.address || ''}, ${row.phone || ''}, 
                            ${row.bin || ''}, ${row.nid || ''}
                        )
                    `);
                } catch (error) {
                    console.log(`⚠️ Error restoring customer ${row.name}:`, error.message);
                }
            }
        }

        // Restore products
        if (data.products && data.products.length > 0) {
            console.log(`🔄 Restoring ${data.products.length} product entries...`);
            for (const row of data.products) {
                try {
                    // Map category to enum value
                    let category = null;
                    if (row.category) {
                        const validCategories = ['Footwear', 'Fan', 'BioShield', 'Instrument'];
                        category = validCategories.find(c =>
                            c.toLowerCase() === row.category.toLowerCase() ||
                            row.category.toLowerCase().includes(c.toLowerCase())
                        ) || null;
                    }

                    await db.execute(sql`
                        INSERT INTO products (
                            sku, name, hs_code, category, unit, cost_ex_vat, sell_ex_vat
                        ) VALUES (
                            ${row.sku || ''}, ${row.product || row.name}, ${row.hs_code || ''}, 
                            ${category ? `${category}::category` : null}, ${row.unit}, 
                            ${row.base_price || row.cost_ex_vat || 0}, ${row.ex_vat_price || row.sell_ex_vat || 0}
                        )
                    `);
                } catch (error) {
                    console.log(`⚠️ Error restoring product ${row.product || row.name}:`, error.message);
                }
            }
        }

        // Restore treasury challans
        if (data.vat_challans && data.vat_challans.length > 0) {
            console.log(`🔄 Restoring ${data.vat_challans.length} treasury challan entries...`);
            for (const row of data.vat_challans) {
                try {
                    // Extract year and month from date
                    const date = new Date(row.date);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;

                    await db.execute(sql`
                        INSERT INTO treasury_challans (
                            voucher_no, token_no, bank, branch, date, account_code, 
                            amount_bdt, period_year, period_month
                        ) VALUES (
                            ${row.voucher_no || row.challan_no}, ${row.token_no || row.challan_no}, 
                            ${row.bank}, ${row.branch}, ${row.date}, ${row.account_code}, 
                            ${row.amount || 0}, ${year}, ${month}
                        )
                    `);
                } catch (error) {
                    console.log(`⚠️ Error restoring treasury challan ${row.challan_no}:`, error.message);
                }
            }
        }

        console.log('✅ Data restoration completed successfully!');
        console.log('📊 Summary:');
        if (data.closing_balance) console.log(`   - ${data.closing_balance.length} closing balance entries`);
        if (data.sales) console.log(`   - ${data.sales.length} sales entries`);
        if (data.vat_computations) console.log(`   - ${data.vat_computations.length} VAT ledger entries`);
        if (data.customers) console.log(`   - ${data.customers.length} customer entries`);
        if (data.products) console.log(`   - ${data.products.length} product entries`);
        if (data.vat_challans) console.log(`   - ${data.vat_challans.length} treasury challan entries`);

    } catch (error) {
        console.error('❌ Restoration failed:', error);
        throw error;
    }
}

restoreFromBackup();