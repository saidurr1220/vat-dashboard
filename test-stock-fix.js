// Test script to check stock functionality
const { Pool } = require('pg');

// Test with your database URLs
const localDB = "postgresql://postgres:2155@127.0.0.1:5432/mydb";
const neonDB = "postgresql://neondb_owner:npg_IgwU4kOpXKC9@ep-super-wildflower-ae724kk0-pooler.c-2.us-east-2.aws.neon.tech/mydb?sslmode=require&channel_binding=require";

async function testConnection(connectionString, name) {
  console.log(`\n🔍 Testing ${name} connection...`);
  
  const pool = new Pool({ connectionString });
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log(`✅ ${name} connection successful`);
    
    // Check if stock_ledger table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_ledger'
      );
    `);
    
    console.log(`📋 stock_ledger table exists: ${tableCheck.rows[0].exists}`);
    
    // Check if v_stock_position view exists
    const viewCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'v_stock_position'
      );
    `);
    
    console.log(`👁️ v_stock_position view exists: ${viewCheck.rows[0].exists}`);
    
    // Count stock ledger entries
    if (tableCheck.rows[0].exists) {
      const stockCount = await client.query('SELECT COUNT(*) FROM stock_ledger');
      console.log(`📊 Stock ledger entries: ${stockCount.rows[0].count}`);
    }
    
    // Count products
    const productCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    if (productCheck.rows[0].exists) {
      const productCount = await client.query('SELECT COUNT(*) FROM products');
      console.log(`🏷️ Products: ${productCount.rows[0].count}`);
    }
    
    client.release();
    
  } catch (error) {
    console.error(`❌ ${name} connection failed:`, error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Testing Database Connections for Stock System\n');
  
  // Test local database
  await testConnection(localDB, 'Local PostgreSQL');
  
  // Test Neon database
  await testConnection(neonDB, 'Neon Database');
  
  console.log('\n✨ Test completed!');
}

main().catch(console.error);