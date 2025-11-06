// Test treasury API directly
async function testTreasuryAPI() {
    const baseUrl = 'https://vat-dashboard.vercel.app';

    try {
        console.log('Testing treasury API...');

        // First login to get cookies
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: process.env.ADMIN_EMAIL || 'admin@example.com',
                password: process.env.ADMIN_PASSWORD || 'change-me'
            })
        });

        if (!loginResponse.ok) {
            console.error('Login failed:', await loginResponse.text());
            return;
        }

        console.log('Login successful');

        // Get cookies from login response
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('Cookies:', cookies);

        // Get CSRF token
        const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Cookie': cookies || '' }
        });

        if (!authResponse.ok) {
            console.error('Auth check failed');
            return;
        }

        const authData = await authResponse.json();
        console.log('Auth data:', authData);

        // Test treasury challan creation
        const treasuryData = {
            tokenNo: 'TEST123456',
            amountBdt: 10000,
            bank: 'Sonali Bank Ltd.',
            branch: 'Local Office',
            date: '2025-02-15',
            accountCode: '1/1133/0010/0311',
            periodYear: 2025,
            periodMonth: 2
        };

        const treasuryResponse = await fetch(`${baseUrl}/api/treasury/challans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies || '',
                'x-csrf-token': authData.csrfToken
            },
            body: JSON.stringify(treasuryData)
        });

        console.log('Treasury response status:', treasuryResponse.status);
        const treasuryResult = await treasuryResponse.json();
        console.log('Treasury result:', treasuryResult);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testTreasuryAPI();