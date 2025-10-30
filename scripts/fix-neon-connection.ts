#!/usr/bin/env tsx

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function fixNeonConnection() {
    console.log('🔧 Neon Database Connection Troubleshooter');
    console.log('==========================================');

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.log('❌ DATABASE_URL not found in environment variables');
        console.log('💡 Make sure your .env.local file exists and contains DATABASE_URL');
        return;
    }

    console.log('✅ DATABASE_URL found in environment');

    // Parse the connection string
    let connectionDetails;
    try {
        const url = new URL(databaseUrl);
        connectionDetails = {
            host: url.hostname,
            port: parseInt(url.port) || 5432,
            database: url.pathname.substring(1),
            user: url.username,
            password: url.password,
            ssl: url.searchParams.get('sslmode') === 'require'
        };

        console.log('\n🔗 Connection Details:');
        console.log(`Host: ${connectionDetails.host}`);
        console.log(`Port: ${connectionDetails.port}`);
        console.log(`Database: ${connectionDetails.database}`);
        console.log(`User: ${connectionDetails.user}`);
        console.log(`SSL: ${connectionDetails.ssl ? 'Required' : 'Optional'}`);

    } catch (error) {
        console.log('❌ Invalid DATABASE_URL format');
        return;
    }

    // Test different connection configurations
    const configs = [
        {
            name: 'Standard Connection',
            config: {
                connectionString: databaseUrl,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000,
            }
        },
        {
            name: 'Direct Connection (no pooler)',
            config: {
                connectionString: databaseUrl.replace('-pooler', ''),
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000,
            }
        },
        {
            name: 'Minimal SSL Connection',
            config: {
                connectionString: databaseUrl,
                ssl: true,
                connectionTimeoutMillis: 15000,
            }
        }
    ];

    for (const { name, config } of configs) {
        console.log(`\n🧪 Testing: ${name}`);
        console.log('─'.repeat(50));

        const pool = new Pool(config);

        try {
            const client = await pool.connect();
            console.log('✅ Connection successful!');

            // Test a simple query
            const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
            console.log(`✅ Query successful!`);
            console.log(`   Time: ${result.rows[0].current_time}`);
            console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);

            // Test table access
            try {
                const tableCheck = await client.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('products', 'imports_boe', 'boe_lots')
                    ORDER BY table_name
                `);
                console.log(`✅ Tables accessible: ${tableCheck.rows.map(r => r.table_name).join(', ')}`);
            } catch (tableError) {
                console.log(`⚠️  Table access issue: ${tableError.message}`);
            }

            client.release();
            await pool.end();

            console.log(`\n🎉 SUCCESS: ${name} works!`);
            console.log('💡 Use this configuration in your application');
            break;

        } catch (error: any) {
            console.log(`❌ Failed: ${error.message}`);

            if (error.code === '28P01') {
                console.log('💡 Authentication failed - password may be incorrect or expired');
            } else if (error.code === 'ENOTFOUND') {
                console.log('💡 Host not found - check your connection string');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('💡 Connection refused - database may be suspended');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('💡 Connection timeout - network or firewall issue');
            }

            await pool.end();
        }
    }

    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('=========================');
    console.log('1. Check if your Neon database is active (not suspended)');
    console.log('2. Verify your password in the Neon dashboard');
    console.log('3. Try regenerating your database password');
    console.log('4. Check if your IP is allowed (if IP restrictions are enabled)');
    console.log('5. Try using the direct connection string (without -pooler)');
    console.log('\n🌐 Neon Dashboard: https://console.neon.tech/');
}

fixNeonConnection().catch(console.error);