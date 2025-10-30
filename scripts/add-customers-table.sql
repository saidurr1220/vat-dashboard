-- Add customers table
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

-- Add indexes
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);
CREATE INDEX IF NOT EXISTS customers_bin_idx ON customers(bin);

-- Add customer_id column to sales table if it doesn't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);

-- Add index for customer_id
CREATE INDEX IF NOT EXISTS sales_customer_idx ON sales(customer_id);