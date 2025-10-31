import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sales, salesLines, customers, stockLedger } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const summary = searchParams.get('summary') === 'true';

        if (summary) {
            // Fast query for summary data
            const salesData = await db.execute(sql`
                SELECT 
                    s.id,
                    s.invoice_no as "invoiceNo",
                    s.dt,
                    s.customer,
                    s.total_value as "totalValue"
                FROM sales s
                ORDER BY s.dt DESC, s.id DESC
                LIMIT ${limit}
            `);
            return NextResponse.json(salesData.rows);
        }

        const salesData = await db.execute(sql`
            SELECT 
                s.id,
                s.invoice_no as "invoiceNo",
                s.dt as date,
                s.customer,
                s.amount_type as "amountType",
                s.total_value as "totalValue",
                s.notes,
                c.name as "customerName",
                c.address as "customerAddress",
                c.phone as "customerPhone",
                c.bin as "customerBin"
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.dt DESC, s.id DESC
            LIMIT ${limit}
        `);

        return NextResponse.json(salesData.rows);
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sales' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            date,
            invoiceNo,
            customer,
            customerId,
            customerInfo,
            amountType,
            grandTotal,
            notes,
            lines,
            isMonthlyBulk
        } = body;

        // For monthly bulk sales, use line amounts as final total
        // Line amounts are calculated on frontend based on product prices
        let finalGrandTotal = grandTotal;
        if (isMonthlyBulk && lines && lines.length > 0) {
            const subtotal = lines.reduce((sum: number, line: any) => sum + Number(line.lineAmount || 0), 0);
            // For monthly bulk, the line amounts are the final amounts
            // VAT calculation is handled on the frontend display
            finalGrandTotal = subtotal;
        }

        // Validate required fields
        const validationErrors = [];
        if (!date || date.trim() === '') validationErrors.push('date');
        if (!invoiceNo || invoiceNo.trim() === '') validationErrors.push('invoiceNo');
        if (!customer || customer.trim() === '') validationErrors.push('customer');
        if (!amountType || amountType.trim() === '') validationErrors.push('amountType');
        if (!lines || !Array.isArray(lines) || lines.length === 0) validationErrors.push('lines');

        // Validate line items
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.productId || isNaN(Number(line.productId))) validationErrors.push(`lines[${i}].productId`);
            if (!line.qty || isNaN(Number(line.qty)) || Number(line.qty) <= 0) validationErrors.push(`lines[${i}].qty`);
            if (!line.unitPrice || isNaN(Number(line.unitPrice)) || Number(line.unitPrice) <= 0) validationErrors.push(`lines[${i}].unitPrice`);
        }

        if (!isMonthlyBulk && (grandTotal === undefined || grandTotal === null || isNaN(Number(grandTotal)))) validationErrors.push('grandTotal');

        if (validationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Missing required fields',
                    missing: validationErrors,
                    received: body
                },
                { status: 400 }
            );
        }

        // Create the sale in a transaction
        const result = await db.transaction(async (tx) => {
            let finalCustomerId = customerId;

            // Create customer if new customer info provided
            if (customerInfo && !customerId) {
                const [newCustomer] = await tx
                    .insert(customers)
                    .values({
                        name: customerInfo.name,
                        address: customerInfo.address || null,
                        phone: customerInfo.phone || null,
                        bin: customerInfo.bin || null,
                        nid: customerInfo.nid || null,
                    })
                    .returning({ id: customers.id });
                finalCustomerId = newCustomer.id;
            }

            // Check stock availability for all products
            for (const line of lines) {
                // Get product category first
                const productResult = await tx.execute(sql`
                    SELECT category FROM products WHERE id = ${line.productId}
                `);

                if (productResult.rows.length === 0) {
                    throw new Error(`Product not found: ${line.productId}`);
                }

                const category = productResult.rows[0].category;
                let currentStock = 0;

                // For all products, check stock_on_hand in products table
                const stockResult = await tx.execute(sql`
                    SELECT COALESCE(stock_on_hand, 0) as stock
                    FROM products 
                    WHERE id = ${line.productId}
                `);
                currentStock = Number(stockResult.rows[0]?.stock || 0);

                if (currentStock < line.qty) {
                    throw new Error(`Insufficient stock for product ID ${line.productId}. Available: ${currentStock}, Required: ${line.qty}`);
                }
            }

            // Insert the sale record
            const [sale] = await tx
                .insert(sales)
                .values({
                    dt: new Date(date),
                    invoiceNo,
                    customer,
                    amountType,
                    totalValue: finalGrandTotal.toString(),
                    notes: isMonthlyBulk ? `${notes || 'Monthly bulk cash sales'} - Bulk Invoice` : (notes || null),
                })
                .returning({ id: sales.id });

            // Insert sale lines
            const saleLineData = lines.map((line: any) => ({
                saleId: sale.id,
                productId: line.productId,
                unit: line.unit,
                qty: line.qty.toString(),
                unitPriceValue: line.unitPrice.toString(),
                amountType,
                lineTotalCalc: line.lineAmount.toString(),
            }));

            await tx.insert(salesLines).values(saleLineData);

            // Update stock for each sale line
            for (const line of lines) {
                // Get product category
                const productResult = await tx.execute(sql`
                    SELECT category FROM products WHERE id = ${line.productId}
                `);

                const category = productResult.rows[0]?.category;

                // For all products, update stock_on_hand in products table
                await tx.execute(sql`
                    UPDATE products 
                    SET stock_on_hand = COALESCE(stock_on_hand, 0) - ${line.qty}
                    WHERE id = ${line.productId}
                `);
            }

            return sale;
        });

        return NextResponse.json({ success: true, saleId: result.id });
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json(
            {
                error: 'Failed to create sale',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        // This would be handled by the individual sale API at /api/sales/[id]
        return NextResponse.json(
            { error: 'Use /api/sales/[id] for updating individual sales' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error in PUT /api/sales:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}