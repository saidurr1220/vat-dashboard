import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sales, salesLines, customers, products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const saleId = parseInt(id);

        // Get sale details with customer info
        const saleResult = await db.execute(sql`
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
        c.bin as "customerBin",
        c.nid as "customerNid"
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ${saleId}
    `);

        if (saleResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Sale not found' },
                { status: 404 }
            );
        }

        const sale = saleResult.rows[0];

        // Get sale lines with product details
        const linesResult = await db.execute(sql`
      SELECT 
        sl.id,
        sl.product_id as "productId",
        sl.unit,
        sl.qty,
        sl.unit_price_value as "unitPrice",
        sl.line_total_calc as "lineTotal",
        p.name as "productName",
        p.hs_code as "hsCode"
      FROM sales_lines sl
      JOIN products p ON sl.product_id = p.id
      WHERE sl.sale_id = ${saleId}
      ORDER BY sl.id
    `);

        const saleLines = linesResult.rows;

        // Return the stored total value as is - don't recalculate VAT
        const totalValue = Number(sale.totalValue);

        return NextResponse.json({
            ...sale,
            saleLines,
            totalValue,
            grandTotal: totalValue, // Use the stored total value
        });
    } catch (error) {
        console.error('Error fetching sale:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sale' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const saleId = parseInt(id);
        const body = await request.json();

        const {
            date,
            invoiceNo,
            customer,
            customerId,
            amountType,
            notes,
            lines
        } = body;

        // Validate required fields
        if (!date || !invoiceNo || !customer || !amountType || !lines || lines.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate totals based on lines and amount type
        const subtotal = lines.reduce((sum: number, line: any) => sum + Number(line.lineAmount || 0), 0);
        let grandTotal = 0;

        if (amountType === "EXCL") {
            // VAT Exclusive: Add 15% VAT on top of subtotal
            grandTotal = subtotal + (subtotal * 0.15);
        } else {
            // VAT Inclusive: subtotal already includes VAT
            grandTotal = subtotal;
        }

        // Update the sale in a transaction (simplified without stock operations)
        const result = await db.transaction(async (tx) => {
            // Check if sale exists
            const existingSale = await tx.execute(sql`
                SELECT id FROM sales WHERE id = ${saleId}
            `);

            if (existingSale.rows.length === 0) {
                throw new Error('Sale not found');
            }

            // Note: Stock operations temporarily disabled due to schema issues
            // TODO: Implement proper stock management later

            // Update the sale record
            const updatedSale = await tx.execute(sql`
                UPDATE sales SET
                  dt = ${new Date(date)},
                  invoice_no = ${invoiceNo},
                  customer = ${customer},
                  customer_id = ${customerId},
                  amount_type = ${amountType},
                  total_value = ${grandTotal.toString()},
                  notes = ${notes || null}
                WHERE id = ${saleId}
                RETURNING id
            `);

            if (updatedSale.rows.length === 0) {
                throw new Error('Sale not found');
            }

            // Delete existing sale lines
            await tx.execute(sql`
                DELETE FROM sales_lines WHERE sale_id = ${saleId}
            `);

            // Insert updated sale lines
            for (const line of lines) {
                await tx.execute(sql`
                    INSERT INTO sales_lines (sale_id, product_id, unit, qty, unit_price_value, amount_type, line_total_calc)
                    VALUES (${saleId}, ${line.productId}, ${line.unit}, ${line.qty}, ${line.unitPrice}, ${amountType}, ${line.lineAmount})
                `);
            }

            // Note: Stock deduction temporarily disabled due to schema issues
            // TODO: Implement proper stock management later

            return updatedSale.rows[0];
        });

        return NextResponse.json({ success: true, saleId });
    } catch (error) {
        console.error('Error updating sale:', error);
        return NextResponse.json(
            { error: 'Failed to update sale' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const saleId = parseInt(id);

        // Delete the sale in a transaction
        const result = await db.transaction(async (tx) => {
            // Get sale details for stock restoration
            const saleDetails = await tx.execute(sql`
                SELECT s.invoice_no, sl.product_id, sl.qty, p.category
                FROM sales s
                JOIN sales_lines sl ON s.id = sl.sale_id
                JOIN products p ON sl.product_id = p.id
                WHERE s.id = ${saleId}
            `);

            if (saleDetails.rows.length === 0) {
                throw new Error('Sale not found');
            }

            const invoiceNo = saleDetails.rows[0].invoice_no;

            // Note: Stock restoration temporarily disabled due to schema issues
            // In a production system, this would restore stock quantities
            console.log(`Would restore stock for ${saleDetails.rows.length} products from sale ${invoiceNo}`);

            // TODO: Implement proper stock restoration when stock_ledger table is available

            // Delete sale lines first (foreign key constraint)
            await tx.execute(sql`
                DELETE FROM sales_lines WHERE sale_id = ${saleId}
            `);

            // Delete the sale
            const deletedSale = await tx.execute(sql`
                DELETE FROM sales WHERE id = ${saleId} RETURNING id
            `);

            if (deletedSale.rows.length === 0) {
                throw new Error('Sale not found');
            }

            return deletedSale.rows[0];
        });

        return NextResponse.json({ success: true, message: 'Sale deleted successfully (stock restoration disabled)' });
    } catch (error) {
        console.error('Error deleting sale:', error);
        return NextResponse.json(
            { error: 'Failed to delete sale' },
            { status: 500 }
        );
    }
}