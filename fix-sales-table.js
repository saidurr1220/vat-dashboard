// Fix sales table structure
const { Pool } = require('pg');

const localDB = "postgresql://postgres:2155@127.0.0.1:5432/mydb";
const neonDB = "postgresql://neondb_owner:npg_IgwU4kOpXKC9@ep-super-wildflower-ae724kk0-pooler.c-2.us-east-2.aws.neon.tech/mydb?sslmode=require&channel_binding=require";

async function checkAndFixSalesTable(connectionString, dbName) {
  console.log(`\n🔍 Checking ${dbName} sales table...`);
  
  const pool = new Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    
    // Check current sales table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sales' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log(`📋 Current sales table columns in ${dbName}:`);
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if customer column exists
    const hasCustomer = tableInfo.rows.some(col => col.column_name === 'customer');
    
    if (!hasCustomer) {
      console.log(`❌ Missing 'customer' column in ${dbName}`);
      console.log(`🔧 Adding customer column...`);
      
      await client.query(`
        ALTER TABLE sales 
        ADD COLUMN IF NOT EXISTS customer TEXT NOT NULL DEFAULT 'Unknown Customer';
      `);
      
      console.log(`✅ Added customer column to ${dbName}`);
    } else {
      console.log(`✅ Customer column exists in ${dbName}`);
    }
    
    // Check sales count
    const salesCount = await client.query('SELECT COUNT(*) FROM sales');
    console.log(`📊 Sales records in ${dbName}: ${salesCount.rows[0].count}`);
    
    // Show sample sales data
    if (parseInt(salesCount.rows[0].count) > 0) {
      const sampleSales = await client.query(`
        SELECT id, invoice_no, dt, customer, total_value 
        FROM sales 
        ORDER BY dt DESC 
        LIMIT 3
      `);
      
      console.log(`📝 Sample sales in ${dbName}:`);
      sampleSales.rows.forEach(sale => {
        console.log(`  - ${sale.invoice_no}: ${sale.customer} - ${sale.total_value}`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error(`❌ Error with ${dbName}:`, error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Fixing Sales Table Structure\n');
  
  // Check and fix local database
  await checkAndFixSalesTable(localDB, 'Local PostgreSQL');
  
  console.log('\n' + '='.repeat(50));
  
  // Check and fix Neon database
  await checkAndFixSalesTable(neonDB, 'Neon Database');
  
  console.log('\n✨ Sales table fix completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your Next.js application');
  console.log('2. Test the sales page');
  console.log('3. Try creating a new sale');
}

main().catch(console.error);