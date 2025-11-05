import { Client } from 'pg';

async function checkSpecificInvoices() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_IgwU4kOpXKC9@ep-super-wildflower-ae724kk0-pooler.c-2.us-east-2.aws.neon.tech/mydb?sslmode=require',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        // Check invoice 20251023 (vul - lal)
        console.log('Invoice 20251023 (Footwear - VUL):');
        console.log('='.repeat(80));

        const inv23 = await client.query(`
            SELECT 
                s.id,
                s.invoice_no,
                s.total_value,
                s.amount_type,
                SUM(sl.line_total_calc) as lines_total,
                COUNT(sl.id) as line_count
            FROM sales s
            LEFT JOIN sales_lines sl ON s.id = sl.sale_id
            WHERE s.invoice_no = '20251023'
            GROUP BY s.id, s.invoice_no, s.total_value, s.amount_type
        `);

        if (inv23.rows.length > 0) {
            const row = inv23.rows[0];
            console.log(`Sale Total: ৳${Number(row.total_value).toLocaleString()}`);
            console.log(`Amount Type: ${row.amount_type}`);
            console.log(`Lines Total: ৳${Number(row.lines_total || 0).toLocaleString()}`);
            console.log(`Line Count: ${row.line_count}`);

            // Calculate both ways
            const saleTotal = Number(row.total_value);
            console.log('');
            console.log('If total_value = GROSS (VAT included):');
            console.log(`  VAT: ৳${((saleTotal * 15) / 115).toLocaleString()}`);
            console.log(`  Net: ৳${(saleTotal - (saleTotal * 15) / 115).toLocaleString()}`);
            console.log('');
            console.log('If total_value = NET (VAT excluded):');
            console.log(`  VAT: ৳${(saleTotal * 0.15).toLocaleString()}`);
            console.log(`  Gross: ৳${(saleTotal * 1.15).toLocaleString()}`);
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('Invoice 20251021 (SCINOVO - THIK):');
        console.log('='.repeat(80));

        const inv21 = await client.query(`
            SELECT 
                s.id,
                s.invoice_no,
                s.total_value,
                s.amount_type,
                SUM(sl.line_total_calc) as lines_total,
                COUNT(sl.id) as line_count
            FROM sales s
            LEFT JOIN sales_lines sl ON s.id = sl.sale_id
            WHERE s.invoice_no = '20251021'
            GROUP BY s.id, s.invoice_no, s.total_value, s.amount_type
        `);

        if (inv21.rows.length > 0) {
            const row = inv21.rows[0];
            console.log(`Sale Total: ৳${Number(row.total_value).toLocaleString()}`);
            console.log(`Amount Type: ${row.amount_type}`);
            console.log(`Lines Total: ৳${Number(row.lines_total || 0).toLocaleString()}`);
            console.log(`Line Count: ${row.line_count}`);

            const saleTotal = Number(row.total_value);
            console.log('');
            console.log('If total_value = GROSS (VAT included):');
            console.log(`  VAT: ৳${((saleTotal * 15) / 115).toLocaleString()}`);
            console.log(`  Net: ৳${(saleTotal - (saleTotal * 15) / 115).toLocaleString()}`);
            console.log('');
            console.log('If total_value = NET (VAT excluded):');
            console.log(`  VAT: ৳${(saleTotal * 0.15).toLocaleString()}`);
            console.log(`  Gross: ৳${(saleTotal * 1.15).toLocaleString()}`);
        }

        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSpecificInvoices();
