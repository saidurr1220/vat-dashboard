import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('=== TEST SALES API ===');
        console.log('Full body:', JSON.stringify(body, null, 2));
        console.log('Body keys:', Object.keys(body));
        console.log('======================');

        const {
            date,
            invoiceNo,
            customer,
            customerId,
            amountType,
            grandTotal,
            notes,
            lines
        } = body;

        console.log('Extracted fields:', {
            date: date || 'MISSING',
            invoiceNo: invoiceNo || 'MISSING',
            customer: customer || 'MISSING',
            customerId: customerId || 'MISSING',
            amountType: amountType || 'MISSING',
            grandTotal: grandTotal || 'MISSING',
            notes: notes || 'MISSING',
            lines: lines ? `Array with ${lines.length} items` : 'MISSING'
        });

        // Check what's missing
        const missing = [];
        if (!date) missing.push('date');
        if (!invoiceNo) missing.push('invoiceNo');
        if (!customer) missing.push('customer');
        if (!amountType) missing.push('amountType');
        if (!lines || lines.length === 0) missing.push('lines');

        if (missing.length > 0) {
            console.log('Missing fields:', missing);
            return NextResponse.json({
                error: 'Missing required fields',
                missing: missing,
                received: body
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'All fields received correctly',
            data: body
        });

    } catch (error) {
        console.error('Test API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}