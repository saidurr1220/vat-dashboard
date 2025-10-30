#!/usr/bin/env tsx

console.log('🔍 Checking environment variables...');

const databaseUrl = process.env.DATABASE_URL;
const postgresUrl = process.env.POSTGRES_URL;

console.log('\n📋 ENVIRONMENT VARIABLES:');
console.log('========================');
console.log(`DATABASE_URL: ${databaseUrl ? '✅ Set' : '❌ Not set'}`);
console.log(`POSTGRES_URL: ${postgresUrl ? '✅ Set' : '❌ Not set'}`);

if (databaseUrl) {
    // Parse the URL to show connection details (without password)
    try {
        const url = new URL(databaseUrl);
        console.log('\n🔗 DATABASE CONNECTION DETAILS:');
        console.log(`Host: ${url.hostname}`);
        console.log(`Port: ${url.port || 'default'}`);
        console.log(`Database: ${url.pathname.substring(1)}`);
        console.log(`Username: ${url.username}`);
        console.log(`Password: ${url.password ? '***hidden***' : '❌ Not set'}`);
        console.log(`SSL: ${url.searchParams.get('sslmode') || 'not specified'}`);

        if (url.hostname.includes('neon.tech')) {
            console.log('\n✅ Neon database detected');
        } else {
            console.log('\n⚠️  Non-Neon database detected');
        }
    } catch (error) {
        console.log('\n❌ Invalid DATABASE_URL format');
    }
}

console.log('\n💡 TROUBLESHOOTING TIPS:');
console.log('========================');
console.log('1. Check your .env.local file exists');
console.log('2. Verify your Neon database credentials');
console.log('3. Ensure your Neon database is not suspended');
console.log('4. Check if your connection string has expired');
console.log('5. Try regenerating your Neon database password');