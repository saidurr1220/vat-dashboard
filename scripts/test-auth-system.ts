import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
    name: string;
    success: boolean;
    message: string;
    status?: number;
}

async function runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    let authCookies = '';
    let csrfToken = '';

    // Test 1: Public endpoint (no auth required)
    try {
        const response = await fetch(`${BASE_URL}/api/public/latest`);
        const data = await response.json();

        results.push({
            name: 'Public Latest Endpoint',
            success: response.ok && response.headers.get('cache-control')?.includes('max-age=30'),
            message: response.ok ? 'Public endpoint accessible with cache headers' : `Failed: ${data.error}`,
            status: response.status
        });
    } catch (error) {
        results.push({
            name: 'Public Latest Endpoint',
            success: false,
            message: `Network error: ${error}`
        });
    }

    // Test 2: Unauthenticated write request (should fail)
    try {
        const response = await fetch(`${BASE_URL}/api/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'data' })
        });

        results.push({
            name: 'Unauthenticated Write Request',
            success: response.status === 401,
            message: response.status === 401 ? 'Correctly rejected unauthenticated request' : 'Should have returned 401',
            status: response.status
        });
    } catch (error) {
        results.push({
            name: 'Unauthenticated Write Request',
            success: false,
            message: `Network error: ${error}`
        });
    }

    // Test 3: Admin login
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@vatdashboard.com',
                password: 'VatAdmin2024!'
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Extract cookies
            const setCookieHeader = response.headers.get('set-cookie');
            if (setCookieHeader) {
                authCookies = setCookieHeader;
                // Extract CSRF token from cookies
                const csrfMatch = setCookieHeader.match(/csrf=([^;]+)/);
                if (csrfMatch) {
                    csrfToken = csrfMatch[1];
                }
            }
        }

        results.push({
            name: 'Admin Login',
            success: response.ok && data.user?.role === 'ADMIN',
            message: response.ok ? 'Admin login successful' : `Login failed: ${data.error}`,
            status: response.status
        });
    } catch (error) {
        results.push({
            name: 'Admin Login',
            success: false,
            message: `Network error: ${error}`
        });
    }

    // Test 4: Authenticated request without CSRF (should fail)
    if (authCookies) {
        try {
            const response = await fetch(`${BASE_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': authCookies
                },
                body: JSON.stringify({ test: 'data' })
            });

            results.push({
                name: 'Authenticated Request Without CSRF',
                success: response.status === 403,
                message: response.status === 403 ? 'Correctly rejected request without CSRF token' : 'Should have returned 403',
                status: response.status
            });
        } catch (error) {
            results.push({
                name: 'Authenticated Request Without CSRF',
                success: false,
                message: `Network error: ${error}`
            });
        }
    }

    // Test 5: Check auth status
    if (authCookies) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/me`, {
                headers: { 'Cookie': authCookies }
            });

            const data = await response.json();

            results.push({
                name: 'Auth Status Check',
                success: response.ok && data.role === 'ADMIN',
                message: response.ok ? 'Auth status correctly returned' : `Failed: ${data.error}`,
                status: response.status
            });
        } catch (error) {
            results.push({
                name: 'Auth Status Check',
                success: false,
                message: `Network error: ${error}`
            });
        }
    }

    // Test 6: Logout
    if (authCookies) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: { 'Cookie': authCookies }
            });

            const data = await response.json();

            results.push({
                name: 'Logout',
                success: response.ok && data.success,
                message: response.ok ? 'Logout successful' : 'Logout failed',
                status: response.status
            });
        } catch (error) {
            results.push({
                name: 'Logout',
                success: false,
                message: `Network error: ${error}`
            });
        }
    }

    return results;
}

async function main() {
    console.log('🔐 Testing Auth System...\n');
    console.log('Make sure the development server is running on http://localhost:3000\n');

    const results = await runTests();

    console.log('Test Results:');
    console.log('=============');

    let passed = 0;
    let failed = 0;

    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        const statusCode = result.status ? ` (${result.status})` : '';
        console.log(`${status} ${result.name}${statusCode}: ${result.message}`);

        if (result.success) passed++;
        else failed++;
    });

    console.log(`\nSummary: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        process.exit(1);
    }
}

main().catch(console.error);