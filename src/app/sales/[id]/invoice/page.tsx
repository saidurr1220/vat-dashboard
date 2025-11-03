import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import EnhancedInvoice from "@/components/EnhancedInvoice";

async function getSaleDetails(id: string) {
  try {
    const saleId = parseInt(id);

    if (isNaN(saleId)) {
      return null;
    }

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

    // Get company settings
    const settingsResult = await db.execute(sql`
      SELECT bin, taxpayer_name, address FROM settings ORDER BY id LIMIT 1
    `);

    if (saleResult.rows.length === 0) {
      return null;
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

    // Calculate VAT breakdown
    const totalValue = Number(sale.totalValue);
    let netOfVat = 0;
    let vatAmount = 0;

    if (sale.amountType === "INCL") {
      // VAT Inclusive: extract VAT from total
      vatAmount = (totalValue * 15) / 115;
      netOfVat = totalValue - vatAmount;
    } else {
      // VAT Exclusive: totalValue is already stored as gross total (net + VAT)
      vatAmount = (totalValue * 15) / 115;
      netOfVat = totalValue - vatAmount;
    }

    return {
      ...sale,
      saleLines: linesResult.rows,
      companySettings: settingsResult.rows[0] || null,
      netOfVat: netOfVat.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      grandTotal: (netOfVat + vatAmount).toFixed(2),
    };
  } catch (error) {
    console.error("Error fetching sale details:", error);
    return null;
  }
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const saleData = await getSaleDetails(id);

  if (!saleData) {
    notFound();
  }

  return <EnhancedInvoice sale={saleData} />;
}
