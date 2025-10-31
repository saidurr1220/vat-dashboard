// Fix Neon database - create view and migrate data
const { Pool } = require('pg');

const localDB = "postgresql://postgres:2155@127.0.0.1:5432/mydb";
const neonDB = "postgresql://neondb_owner:npg_IgwU4kOpXKC9@ep-super-wildflower-ae724kk0-pooler.c-2.us-east-2.aws.neon.tech/mydb?sslmode=require&channel_binding=require";

async function createStockView(client) {
  console.log('📊 Creating v_stock_position view...');
  
  const createViewSQL = `
    CREATE OR REPLACE VIEW v_stock_position AS
    SELECT 
      p.category,
      p.name as product,
      ib.boe_no,
      ib.boe_date,
      COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) as qty_on_hand,
      p.cost_ex_vat as cost_price,
      p.sell_ex_vat as selling_price,
      0.15 as vat_rate,
      COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) * p.cost_ex_vat as value_cost,
      COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) * p.sell_ex_vat as value_sell,
      p.unit
    FROM products p
    LEFT JOIN stock_ledger sl ON p.id = sl.product_id
    LEFT JOIN imports_boe ib ON p.hs_code = ib.hs_code
    GROUP BY p.id, p.category, p.name, p.cost_ex_vat, p.sell_ex_vat, p.unit, ib.boe_no, ib.boe_date
    HAVING COALESCE(SUM(sl.qty_in::numeric) - SUM(sl.qty_out::numeric), 0) > 0
    ORDER BY value_sell DESC;
  `;
  
  await client.query(createViewSQL);
  console.log('✅ v_stock_position view created');
}

async function migrateDataToNeon() {
  console.log('🔄 Starting data migration from Local to Neon...');
  
  const localPool = new Pool({ connectionString: localDB });
  const neonPool = new Pool({ connectionString: neonDB });
  
  try {
    const localClient = await localPool.connect();
    const neonClient = await neonPool.connect();
    
    // 1. Migrate products
    console.log('📦 Migrating products...');
    const products = await localClient.query('SELECT * FROM products ORDER BY id');
    
    for (const product of products.rows) {
      await neonClient.query(`
        INSERT INTO products (name, sku, hs_code, category, unit, tests_per_kit, cost_ex_vat, sell_ex_vat, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (sku) DO UPDATE SET
          name = EXCLUDED.name,
          hs_code = EXCLUDED.hs_code,
          category = EXCLUDED.category,
          unit = EXCLUDED.unit,
          cost_ex_vat = EXCLUDED.cost_ex_vat,
          sell_ex_vat = EXCLUDED.sell_ex_vat
      `, [
        product.name,
        product.sku,
        product.hs_code,
        product.category,
        product.unit,
        product.tests_per_kit,
        product.cost_ex_vat,
        product.sell_ex_vat,
        product.created_at,
        product.updated_at
      ]);
    }
    console.log(`✅ Migrated ${products.rows.length} products`);
    
    // 2. Get product ID mapping (local ID -> neon ID)
    const neonProducts = await neonClient.query('SELECT id, name FROM products');
    const productMap = new Map();
    
    for (const localProduct of products.rows) {
      const neonProduct = neonProducts.rows.find(p => p.name === localProduct.name);
      if (neonProduct) {
        productMap.set(localProduct.id, neonProduct.id);
      }
    }
    
    // 3. Migrate stock ledger
    console.log('📊 Migrating stock ledger...');
    const stockEntries = await localClient.query('SELECT * FROM stock_ledger ORDER BY dt');
    
    for (const entry of stockEntries.rows) {
      const neonProductId = productMap.get(entry.product_id);
      if (neonProductId) {
        await neonClient.query(`
          INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          entry.dt,
          neonProductId,
          entry.ref_type,
          entry.ref_no,
          entry.qty_in,
          entry.qty_out,
          entry.unit_cost_ex_vat,
          entry.created_at
        ]);
      }
    }
    console.log(`✅ Migrated ${stockEntries.rows.length} stock entries`);
    
    // 4. Create the stock view
    await createStockView(neonClient);
    
    // 5. Test the view
    console.log('🧪 Testing stock view...');
    const stockTest = await neonClient.query('SELECT COUNT(*) FROM v_stock_position');
    console.log(`✅ Stock view working - ${stockTest.rows[0].count} items with stock`);
    
    localClient.release();
    neonClient.release();
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

async function fixLocalView() {
  console.log('🔧 Fixing local database view...');
  
  const localPool = new Pool({ connectionString: localDB });
  
  try {
    const client = await localPool.connect();
    await createStockView(client);
    
    // Test the view
    const stockTest = await client.query('SELECT COUNT(*) FROM v_stock_position');
    console.log(`✅ Local stock view working - ${stockTest.rows[0].count} items with stock`);
    
    client.release();
  } catch (error) {
    console.error('❌ Local view fix failed:', error);
  } finally {
    await localPool.end();
  }
}

async function main() {
  console.log('🚀 Fixing Stock Database Issues\n');
  
  // Fix local database view first
  await fixLocalView();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Migrate data to Neon
  await migrateDataToNeon();
  
  console.log('\n✨ All fixes completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your .env file to use the Neon database');
  console.log('2. Test stock functionality in your app');
  console.log('3. Try adding/adjusting stock through the UI');
}

main().catch(console.error);