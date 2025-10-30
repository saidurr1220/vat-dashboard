-- Add some sample historical sales data
-- First, let's add some sample customers
INSERT INTO customers (name, address, phone, bin) VALUES
('ABC Trading Ltd', '123 Main Street, Dhaka', '01711111111', '001234567-0101'),
('XYZ Corporation', '456 Commercial Area, Chittagong', '01722222222', '001234568-0102'),
('General Store', '789 Market Road, Sylhet', '01733333333', NULL),
('Medical Supplies Co', '321 Hospital Road, Dhaka', '01744444444', '001234569-0103')
ON CONFLICT DO NOTHING;

-- Add some sample sales from previous months
-- October 2025 sales
INSERT INTO sales (invoice_no, dt, customer_id, customer, amount_type, total_value, notes) VALUES
('INV-000001', '2025-10-01', 1, 'ABC Trading Ltd', 'EXCL', '50000', 'Monthly order'),
('INV-000002', '2025-10-03', 2, 'XYZ Corporation', 'INCL', '75000', 'Bulk purchase'),
('INV-000003', '2025-10-05', 3, 'General Store', 'EXCL', '25000', 'Regular order'),
('INV-000004', '2025-10-08', 4, 'Medical Supplies Co', 'INCL', '120000', 'Medical equipment'),
('INV-000005', '2025-10-12', 1, 'ABC Trading Ltd', 'EXCL', '35000', 'Follow-up order'),
('INV-000006', '2025-10-15', 2, 'XYZ Corporation', 'EXCL', '85000', 'Special items'),
('INV-000007', '2025-10-18', 3, 'General Store', 'INCL', '45000', 'Mixed products'),
('INV-000008', '2025-10-22', 4, 'Medical Supplies Co', 'EXCL', '95000', 'Reagents order'),
('INV-000009', '2025-10-25', 1, 'ABC Trading Ltd', 'INCL', '65000', 'End of month'),
('INV-000010', '2025-10-28', 2, 'XYZ Corporation', 'EXCL', '55000', 'Regular supply')
ON CONFLICT (invoice_no) DO NOTHING;

-- September 2025 sales
INSERT INTO sales (invoice_no, dt, customer_id, customer, amount_type, total_value, notes) VALUES
('INV-SEP-001', '2025-09-02', 1, 'ABC Trading Ltd', 'EXCL', '48000', 'September order'),
('INV-SEP-002', '2025-09-05', 2, 'XYZ Corporation', 'INCL', '72000', 'Monthly supply'),
('INV-SEP-003', '2025-09-08', 3, 'General Store', 'EXCL', '28000', 'Regular stock'),
('INV-SEP-004', '2025-09-12', 4, 'Medical Supplies Co', 'INCL', '115000', 'Medical supplies'),
('INV-SEP-005', '2025-09-15', 1, 'ABC Trading Ltd', 'EXCL', '38000', 'Additional items'),
('INV-SEP-006', '2025-09-18', 2, 'XYZ Corporation', 'EXCL', '82000', 'Bulk order'),
('INV-SEP-007', '2025-09-22', 3, 'General Store', 'INCL', '42000', 'Mixed goods'),
('INV-SEP-008', '2025-09-25', 4, 'Medical Supplies Co', 'EXCL', '92000', 'Lab equipment'),
('INV-SEP-009', '2025-09-28', 1, 'ABC Trading Ltd', 'INCL', '62000', 'Month end')
ON CONFLICT (invoice_no) DO NOTHING;

-- August 2025 sales
INSERT INTO sales (invoice_no, dt, customer_id, customer, amount_type, total_value, notes) VALUES
('INV-AUG-001', '2025-08-03', 1, 'ABC Trading Ltd', 'EXCL', '45000', 'August start'),
('INV-AUG-002', '2025-08-07', 2, 'XYZ Corporation', 'INCL', '68000', 'Regular order'),
('INV-AUG-003', '2025-08-10', 3, 'General Store', 'EXCL', '32000', 'Store supplies'),
('INV-AUG-004', '2025-08-14', 4, 'Medical Supplies Co', 'INCL', '108000', 'Medical order'),
('INV-AUG-005', '2025-08-18', 1, 'ABC Trading Ltd', 'EXCL', '41000', 'Mid month'),
('INV-AUG-006', '2025-08-22', 2, 'XYZ Corporation', 'EXCL', '78000', 'Special request'),
('INV-AUG-007', '2025-08-26', 3, 'General Store', 'INCL', '39000', 'End month'),
('INV-AUG-008', '2025-08-29', 4, 'Medical Supplies Co', 'EXCL', '88000', 'Final order')
ON CONFLICT (invoice_no) DO NOTHING;

-- Add corresponding sales lines for some of the sales
-- Get product IDs first (assuming products exist)
DO $$
DECLARE
    sale_id INTEGER;
    product_id INTEGER;
BEGIN
    -- Add sales lines for INV-000001
    SELECT id INTO sale_id FROM sales WHERE invoice_no = 'INV-000001';
    SELECT id INTO product_id FROM products LIMIT 1;
    
    IF sale_id IS NOT NULL AND product_id IS NOT NULL THEN
        INSERT INTO sales_lines (sale_id, product_id, unit, qty, unit_price_value, amount_type, line_total_calc) VALUES
        (sale_id, product_id, 'Pc', '100', '500', 'EXCL', '50000')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Add sales lines for INV-000002
    SELECT id INTO sale_id FROM sales WHERE invoice_no = 'INV-000002';
    
    IF sale_id IS NOT NULL AND product_id IS NOT NULL THEN
        INSERT INTO sales_lines (sale_id, product_id, unit, qty, unit_price_value, amount_type, line_total_calc) VALUES
        (sale_id, product_id, 'Pc', '150', '500', 'INCL', '75000')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;