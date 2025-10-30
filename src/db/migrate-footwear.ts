import { db } from './client';
import { sql } from 'drizzle-orm';

export async function createFootwearTables() {
    try {
        console.log('Creating footwear tables...');

        // Create product_groups table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_groups (
        id SERIAL PRIMARY KEY,
        group_name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // Create product_group_members table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, product_id)
      )
    `);

        // Create indexes for product_group_members
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS product_group_members_group_id_idx ON product_group_members(group_id)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS product_group_members_product_id_idx ON product_group_members(product_id)
    `);

        // Create product_aliases table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_aliases (
        id SERIAL PRIMARY KEY,
        alias_text TEXT NOT NULL,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // Create indexes for product_aliases
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS product_aliases_alias_text_idx ON product_aliases(alias_text)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS product_aliases_product_id_idx ON product_aliases(product_id)
    `);

        // Create boe_lots table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS boe_lots (
        id SERIAL PRIMARY KEY,
        lot_id TEXT NOT NULL UNIQUE,
        boe_number INTEGER NOT NULL,
        boe_item_no INTEGER NOT NULL,
        boe_date DATE NOT NULL,
        product_id INTEGER NOT NULL REFERENCES products(id),
        description TEXT NOT NULL,
        hs_code TEXT,
        base_value NUMERIC(12, 2),
        sd_value NUMERIC(12, 2),
        unit_purchase_cost NUMERIC(10, 2),
        category TEXT NOT NULL,
        month TEXT NOT NULL,
        carton_size INTEGER,
        opening_pairs INTEGER NOT NULL,
        closing_pairs INTEGER NOT NULL,
        declared_unit_value NUMERIC(10, 4),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // Create indexes for boe_lots
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS boe_lots_boe_number_item_idx ON boe_lots(boe_number, boe_item_no)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS boe_lots_boe_date_idx ON boe_lots(boe_date)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS boe_lots_product_id_idx ON boe_lots(product_id)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS boe_lots_category_idx ON boe_lots(category)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS boe_lots_month_idx ON boe_lots(month)
    `);

        // Create sale_line_allocations table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sale_line_allocations (
        id SERIAL PRIMARY KEY,
        sale_line_id INTEGER NOT NULL REFERENCES sales_lines(id) ON DELETE CASCADE,
        boe_lot_id INTEGER NOT NULL REFERENCES boe_lots(id),
        allocated_pairs INTEGER NOT NULL,
        override_before_boe BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // Create indexes for sale_line_allocations
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS sale_line_allocations_sale_line_id_idx ON sale_line_allocations(sale_line_id)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS sale_line_allocations_boe_lot_id_idx ON sale_line_allocations(boe_lot_id)
    `);

        // Create vat_summary table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vat_summary (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL UNIQUE,
        sales_value_ex_vat NUMERIC(12, 2) DEFAULT 0,
        output_vat NUMERIC(12, 2) DEFAULT 0,
        invoice_count INTEGER DEFAULT 0,
        adjustments NUMERIC(12, 2) DEFAULT 0,
        status TEXT DEFAULT 'open',
        closed_at TIMESTAMP,
        closed_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // Create indexes for vat_summary
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS vat_summary_month_idx ON vat_summary(month)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS vat_summary_status_idx ON vat_summary(status)
    `);

        // Create price_memory table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS price_memory (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        group_id INTEGER REFERENCES product_groups(id),
        last_sale_price NUMERIC(10, 2),
        last_sale_date TIMESTAMP,
        sale_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // Create indexes for price_memory
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS price_memory_product_id_idx ON price_memory(product_id)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS price_memory_group_id_idx ON price_memory(group_id)
    `);

        // Create audit_log table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        user_id TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        notes TEXT
      )
    `);

        // Create indexes for audit_log
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS audit_log_entity_type_idx ON audit_log(entity_type)
    `);
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON audit_log(timestamp)
    `);

        console.log('✅ All footwear tables created successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error creating footwear tables:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    createFootwearTables()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}