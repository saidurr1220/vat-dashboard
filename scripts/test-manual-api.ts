async function testManualAPI() {
    try {
        console.log('Testing manual add API...');

        const testPayload = {
            boeNo: "TEST001",
            boeDate: "2025-11-02",
            officeCode: null,
            itemNo: "1",
            hsCode: "6403.99.00",
            description: "Test Product",
            assessableValue: 10000,
            baseVat: 1500,
            sd: 2000,
            vat: 1500,
            at: 500,
            qty: 10,
            unit: "Pc"
        };

        console.log('Sending payload:', testPayload);

        const response = await fetch('http://localhost:3000/api/imports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Success result:', result);
        } else {
            const error = await response.text();
            console.log('Error result:', error);
        }

    } catch (error) {
        console.error('Test error:', error);
    }
    process.exit(0);
}

testManualAPI();