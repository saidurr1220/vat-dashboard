async function testLoginAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'saidurr1256@gmail.com',
                password: 'Rahman2155'
            })
        });

        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', data);
        console.log('Set-Cookie header:', response.headers.get('set-cookie'));

    } catch (error) {
        console.error('API test failed:', error);
    }
}

testLoginAPI();