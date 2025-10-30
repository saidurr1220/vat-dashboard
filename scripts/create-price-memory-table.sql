-- Create price_memory table
CREATE TABLE IF NOT EXISTS price_memory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    last_price DECIMAL(10,2) NOT NULL,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS price_memory_last_used_idx ON price_memory(last_used);

-- Insert some sample data if table is empty
INSERT INTO price_memory (product_id, last_price, last_used)
SELECT p.id, COALESCE(p.sell_ex_vat, 0), CURRENT_TIMESTAMP
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM price_memory WHERE product_id = p.id)
AND p.sell_ex_vat IS NOT NULL
LIMIT 10;