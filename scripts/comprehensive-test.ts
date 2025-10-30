import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function testAPI(url: string, method: string = 'GET', body?: any) {
    try {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`http://localhost:3000${url}`, options);
        return {
            url,
            status: response.status,
            ok: response.ok,
            error: response.ok ? null : await response.text()
        };
    } catch (error) {
        return {
            url,
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Application Test...\n');

    const tests = [
        // Core API endpoints
        { name: 'Products API', url: '/api/products' },
        { name: 'Sales API', url: '/api/sales' },
        { name: 'Customers API', url: '/api/customers' },
        { name: 'Stock Summary API', url: '/api/stock/summary' },
        { name: 'VAT Ledger API', url: '/api/vat/ledger' },
        { name: 'VAT Closing Balance API', url: '/api/vat/closing-balance' },
        { name: 'Treasury Challans API', url: '/api/treasury/challans' },
        { name: 'Settings API', url: '/api/settings' },

        // Stock management
        { name: 'Stock Ledger API', url: '/api/stock/ledger' },

        // Meta endpoints
        { name: 'Entity Meta API', url: '/api/meta/entity' },
        { name: 'Next Invoice API', url: '/api/sales/next-invoice' },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = await testAPI(test.url);

        if (result.ok) {
            console.log(`✅ ${test.name}: PASSED (${result.status})`);
            passed++;
        } else {
            console.log(`❌ ${test.name}: FAILED (${result.status}) - ${result.error}`);
            failed++;
        }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Application is fully functional.');
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed. Please check the issues above.`);
    }
}

runComprehensiveTest().catch(console.error);