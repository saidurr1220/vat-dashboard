import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupCustomers() {
    console.log("🔧 Setting up customers table...");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Add customers table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          bin TEXT,
          nid TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

        // Add indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS customers_bin_idx ON customers(bin);`);

        // Add customer_id column to sales table if it doesn't exist
        await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);`);

        // Add index for customer_id
        await pool.query(`CREATE INDEX IF NOT EXISTS sales_customer_idx ON sales(customer_id);`);

        console.log("✅ Customers table setup completed!");

        // Add some sample customers
        await pool.query(`
      INSERT INTO customers (name, address, phone, bin) VALUES
      ('ABC Trading Ltd', '123 Main Street, Dhaka', '01711111111', '001234567-0101'),
      ('XYZ Corporation', '456 Commercial Area, Chittagong', '01722222222', '001234568-0102'),
      ('General Store', '789 Market Road, Sylhet', '01733333333', NULL),
      ('Medical Supplies Co', '321 Hospital Road, Dhaka', '01744444444', '001234569-0103')
      ON CONFLICT DO NOTHING;
    `);

        console.log("✅ Sample customers added!");

    } catch (error) {
        console.error("❌ Error setting up customers:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupCustomers();