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

        // Update the sale in a transaction
        const result = await db.transaction(async (tx) => {
            // Get original sale details for stock reversal
            console.log('Looking for sale ID:', saleId);
            const originalSale = await tx.execute(sql`
                SELECT invoice_no FROM sales WHERE id = ${saleId}
            `);

            if (originalSale.rows.length === 0) {
                throw new Error('Sale not found');
            }

            const originalInvoiceNo = originalSale.rows[0].invoice_no;

            // Get original sale lines for stock restoration
            const originalLines = await tx.execute(sql`
                SELECT sl.product_id, sl.qty, p.category
                FROM sales_lines sl
                JOIN products p ON sl.product_id = p.id
                WHERE sl.sale_id = ${saleId}
            `);

            // Restore stock for original sale lines
            for (const originalLine of originalLines.rows) {
                const productId = originalLine.product_id;
                const qty = Number(originalLine.qty);
                const category = originalLine.category;

                if (category === 'Footwear') {
                    // For footwear, restore stock to boe_lots (add back to the most recent lot)
                    const latestLot = await tx.execute(sql`
                        SELECT id, closing_pairs 
                        FROM boe_lots 
                        WHERE product_id = ${productId}
                        ORDER BY boe_date DESC, id DESC
                        LIMIT 1
                    `);

                    if (latestLot.rows.length > 0) {
                        const lotId = latestLot.rows[0].id;
                        const currentClosingPairs = Number(latestLot.rows[0].closing_pairs);
                        const newClosingPairs = currentClosingPairs + qty;

                        await tx.execute(sql`
                            UPDATE boe_lots 
                            SET closing_pairs = ${newClosingPairs}
                            WHERE id = ${lotId}
                        `);
                    }
                }
            }

            // Remove original stock ledger entries for this sale
            await tx.execute(sql`
                DELETE FROM stock_ledger 
                WHERE ref_type = 'SALE' AND ref_no = ${originalInvoiceNo}
            `);

            // Check stock availability for new lines
            for (const line of lines) {
                // Get product category
                const productResult = await tx.execute(sql`
                    SELECT category FROM products WHERE id = ${line.productId}
                `);

                if (productResult.rows.length === 0) {
                    throw new Error(`Product not found: ${line.productId}`);
                }

                const category = productResult.rows[0].category;
                let currentStock = 0;

                if (category === 'Footwear') {
                    // For footwear, check boe_lots
                    const stockResult = await tx.execute(sql`
                        SELECT COALESCE(SUM(closing_pairs), 0) as stock
                        FROM boe_lots 
                        WHERE product_id = ${line.productId}
                    `);
                    currentStock = Number(stockResult.rows[0]?.stock || 0);
                } else {
                    // For other products, check stock_ledger
                    const stockResult = await tx.execute(sql`
                        SELECT COALESCE(SUM(qty_in::numeric) - SUM(qty_out::numeric), 0) as stock
                        FROM stock_ledger 
                        WHERE product_id = ${line.productId}
                    `);
                    currentStock = Number(stockResult.rows[0]?.stock || 0);
                }

                if (currentStock < line.qty) {
                    throw new Error(`Insufficient stock for product ID ${line.productId}. Available: ${currentStock}, Required: ${line.qty}`);
                }
            }

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

            // Deduct stock for new sale lines
            for (const line of lines) {
                // Get product category
                const productResult = await tx.execute(sql`
                    SELECT category FROM products WHERE id = ${line.productId}
                `);

                const category = productResult.rows[0].category;

                if (category === 'Footwear') {
                    // For footwear, update boe_lots by reducing closing_pairs (FIFO)
                    let remainingQty = line.qty;

                    const lotsResult = await tx.execute(sql`
                        SELECT id, closing_pairs 
                        FROM boe_lots 
                        WHERE product_id = ${line.productId} AND closing_pairs > 0
                        ORDER BY boe_date ASC, id ASC
                    `);

                    for (const lot of lotsResult.rows) {
                        if (remainingQty <= 0) break;

                        const lotClosingPairs = Number(lot.closing_pairs);
                        const deductQty = Math.min(remainingQty, lotClosingPairs);
                        const newClosingPairs = lotClosingPairs - deductQty;

                        await tx.execute(sql`
                            UPDATE boe_lots 
                            SET closing_pairs = ${newClosingPairs}
                            WHERE id = ${lot.id}
                        `);

                        remainingQty -= deductQty;
                    }

                    if (remainingQty > 0) {
                        throw new Error(`Insufficient footwear stock for product ID ${line.productId}`);
                    }
                } else {
                    // For other products, use stock_ledger
                    await tx.execute(sql`
                        INSERT INTO stock_ledger (dt, product_id, ref_type, ref_no, qty_in, qty_out, unit_cost_ex_vat)
                        VALUES (${new Date(date)}, ${line.productId}, 'SALE', ${invoiceNo}, 0, ${line.qty}, 0)
                    `);
                }
            }

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

            // Restore stock for each product
            for (const saleDetail of saleDetails.rows) {
                const productId = saleDetail.product_id;
                const qty = Number(saleDetail.qty);
                const category = saleDetail.category;

                if (category === 'Footwear') {
                    // For footwear, restore stock to boe_lots (add back to the most recent lot)
                    const latestLot = await tx.execute(sql`
                        SELECT id, closing_pairs 
                        FROM boe_lots 
                        WHERE product_id = ${productId}
                        ORDER BY boe_date DESC, id DESC
                        LIMIT 1
                    `);

                    if (latestLot.rows.length > 0) {
                        const lotId = latestLot.rows[0].id;
                        const currentClosingPairs = Number(latestLot.rows[0].closing_pairs);
                        const newClosingPairs = currentClosingPairs + qty;

                        await tx.execute(sql`
                            UPDATE boe_lots 
                            SET closing_pairs = ${newClosingPairs}
                            WHERE id = ${lotId}
                        `);
                    }
                }
            }

            // Remove the original sale stock entries (for non-footwear products)
            await tx.execute(sql`
                DELETE FROM stock_ledger 
                WHERE ref_type = 'SALE' AND ref_no = ${invoiceNo}
            `);

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

        return NextResponse.json({ success: true, message: 'Sale deleted and stock restored' });
    } catch (error) {
        console.error('Error deleting sale:', error);
        return NextResponse.json(
            { error: 'Failed to delete sale' },
            { status: 500 }
        );
    }
}