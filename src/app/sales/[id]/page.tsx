import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceActions from "@/components/InvoiceActions";
import "./invoice-print.css";

async function getSaleDetails(id: string) {
  try {
    const saleId = parseInt(id);

    if (isNaN(saleId)) {
      console.error("Invalid sale ID:", id);
      return null;
    }

    // Get sale details with customer info
    const saleResult = await db.execute(sql`
      SELECT 
        s.id,
        s.invoice_no as "invoiceNo",
        s.dt,
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

    // Get company settings for seller information
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

    const saleLines = linesResult.rows;

    // Use stored total value as final amount - don't recalculate VAT
    const totalValue = Number(sale.totalValue);
    const grandTotal = totalValue; // This is the final amount including VAT

    // Calculate VAT breakdown for display purposes only
    let vatAmount = 0;
    let netOfVat = 0;

    if (sale.amountType === "INCL") {
      // VAT Inclusive: extract VAT from total
      vatAmount = (totalValue * 15) / 115;
      netOfVat = totalValue - vatAmount;
    } else {
      // VAT Exclusive: total already includes added VAT
      netOfVat = totalValue / 1.15; // Back-calculate the ex-VAT amount
      vatAmount = totalValue - netOfVat;
    }

    return {
      ...sale,
      saleLines,
      vatAmount,
      netOfVat,
      grandTotal,
      companySettings: settingsResult.rows[0] || null,
    };
  } catch (error) {
    console.error("Error fetching sale:", error);
    return null;
  }
}

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const saleData = await getSaleDetails(id);

  if (!saleData) {
    notFound();
  }

  // Type assertion for easier access
  const sale = saleData as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 print:p-0 print:m-0">
        {/* Header - Hidden in print */}
        <div className="mb-6 print:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Invoice #{sale.invoiceNo}
              </h1>
            </div>
            <InvoiceActions saleId={sale.id} invoiceNo={sale.invoiceNo} />
          </div>
        </div>

        {/* Professional Tax Invoice - Clean Design */}
        <div className="bg-white shadow-lg border border-gray-200 print:shadow-none print:border-0 print:m-0">
          {/* Clean Professional Header */}
          <div className="relative bg-gray-900 text-white p-6 print:bg-white print:text-black print:border-b-2 print:border-black">
            {/* মূসক-৬.৩ badge */}
            <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs font-bold print:bg-black print:text-white">
              মূসক-৬.৩
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h1 className="text-3xl font-bold mb-3 print:text-black">
                  TAX INVOICE
                </h1>
                <div className="text-base space-y-2 print:text-black">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 print:text-gray-600 font-medium">
                      Invoice No:
                    </span>
                    <span className="font-mono font-bold bg-gray-800 px-3 py-1 rounded print:bg-gray-100 print:text-black">
                      {sale.invoiceNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 print:text-gray-600 font-medium">
                      Date:
                    </span>
                    <span className="font-mono font-semibold print:text-black">
                      {new Date(sale.dt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 print:bg-gray-100 print:border-black">
                  <p className="text-sm font-bold mb-1 print:text-black">
                    ORIGINAL FOR BUYER
                  </p>
                  <p className="text-xs text-gray-300 print:text-gray-600">
                    VAT Registration Certificate Required
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Company & Customer Info */}
          <div className="p-4 bg-gray-50 print:bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Seller Information */}
              {sale.companySettings && (
                <div className="bg-white border border-gray-200 print:border-black">
                  <div className="bg-gray-100 p-4 border-b border-gray-200 print:bg-gray-200 print:border-black">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      SELLER / SUPPLIER
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="text-base font-bold text-gray-900">
                      {sale.companySettings.taxpayer_name}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-gray-600">
                          Address:
                        </span>
                        <span className="ml-2 text-gray-800">
                          {sale.companySettings.address}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">
                          BIN:
                        </span>
                        <span className="ml-2 font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {sale.companySettings.bin}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">
                          VAT Registration:
                        </span>
                        <span className="ml-2 text-gray-900 font-semibold">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Information */}
              <div className="bg-white border border-gray-200 print:border-black">
                <div className="bg-gray-100 p-4 border-b border-gray-200 print:bg-gray-200 print:border-black">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    BUYER / CUSTOMER
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="text-base font-bold text-gray-900">
                    {sale.customerName || sale.customer}
                  </h4>
                  <div className="space-y-1 text-sm">
                    {sale.customerAddress && (
                      <div>
                        <span className="font-semibold text-gray-600">
                          Address:
                        </span>
                        <span className="ml-2 text-gray-800">
                          {sale.customerAddress}
                        </span>
                      </div>
                    )}
                    {sale.customerPhone && (
                      <div>
                        <span className="font-semibold text-gray-600">
                          Phone:
                        </span>
                        <span className="ml-2 font-mono text-gray-800">
                          {sale.customerPhone}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-600">BIN:</span>
                      {sale.customerBin ? (
                        <span className="ml-2 font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {sale.customerBin}
                        </span>
                      ) : (
                        <span className="ml-2 text-gray-500 italic">
                          Not Provided
                        </span>
                      )}
                    </div>
                    {sale.customerNid && (
                      <div>
                        <span className="font-semibold text-gray-600">
                          NID:
                        </span>
                        <span className="ml-2 font-mono text-gray-800">
                          {sale.customerNid}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Items Table */}
          <div className="p-4">
            <div className="border border-gray-200 print:border-black">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900 text-white print:bg-gray-200 print:text-black">
                    <th className="p-2 text-left font-bold text-xs border-r border-gray-700 print:border-black">
                      SL.
                    </th>
                    <th className="p-2 text-left font-bold text-xs border-r border-gray-700 print:border-black">
                      DESCRIPTION OF GOODS/SERVICES
                    </th>
                    <th className="p-2 text-center font-bold text-xs border-r border-gray-700 print:border-black">
                      HS CODE
                    </th>
                    <th className="p-2 text-center font-bold text-xs border-r border-gray-700 print:border-black">
                      UNIT
                    </th>
                    <th className="p-2 text-right font-bold text-xs border-r border-gray-700 print:border-black">
                      QTY
                    </th>
                    <th className="p-2 text-right font-bold text-xs border-r border-gray-700 print:border-black">
                      UNIT PRICE (৳)
                    </th>
                    <th className="p-2 text-right font-bold text-xs">
                      TOTAL VALUE (৳)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.saleLines.map((line: any, index: number) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } border-b border-gray-200 print:border-black`}
                    >
                      <td className="p-2 text-center font-mono font-semibold border-r border-gray-200 print:border-black text-xs">
                        {(index + 1).toString().padStart(2, "0")}
                      </td>
                      <td className="p-2 border-r border-gray-200 print:border-black">
                        <div className="font-semibold text-gray-900 text-xs">
                          {line.productName}
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono border-r border-gray-200 print:border-black text-gray-600 text-xs">
                        {line.hsCode || "—"}
                      </td>
                      <td className="p-2 text-center font-semibold border-r border-gray-200 print:border-black">
                        <span className="bg-gray-100 px-1 py-1 rounded text-xs">
                          {line.unit}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono font-semibold border-r border-gray-200 print:border-black text-xs">
                        {Number(line.qty).toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-mono font-semibold border-r border-gray-200 print:border-black text-xs">
                        {Number(line.unitPrice).toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-gray-900 text-sm">
                        {Number(line.lineTotal).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows for standard format */}
                  {Array.from({
                    length: Math.max(0, 2 - sale.saleLines.length),
                  }).map((_, index) => (
                    <tr
                      key={`empty-${index}`}
                      className="border-b border-gray-200 print:border-black h-12"
                    >
                      <td className="p-3 border-r border-gray-200 print:border-black">
                        &nbsp;
                      </td>
                      <td className="p-3 border-r border-gray-200 print:border-black">
                        &nbsp;
                      </td>
                      <td className="p-3 border-r border-gray-200 print:border-black">
                        &nbsp;
                      </td>
                      <td className="p-3 border-r border-gray-200 print:border-black">
                        &nbsp;
                      </td>
                      <td className="p-3 border-r border-gray-200 print:border-black">
                        &nbsp;
                      </td>
                      <td className="p-3 border-r border-gray-200 print:border-black">
                        &nbsp;
                      </td>
                      <td className="p-3">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clean Totals & Payment Section */}
          <div className="p-4 bg-gray-50 print:bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Payment Terms & Notes */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 print:border-black">
                  <div className="bg-gray-100 p-3 border-b border-gray-200 print:bg-gray-200 print:border-black">
                    <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                      PAYMENT TERMS
                    </h4>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 font-medium">Cash Payment</p>
                  </div>
                </div>

                {sale.notes && (
                  <div className="bg-white border border-gray-200 print:border-black">
                    <div className="bg-gray-100 p-3 border-b border-gray-200 print:bg-gray-200 print:border-black">
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                        REMARKS
                      </h4>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 italic">{sale.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Clean Totals */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 print:border-black">
                  <div className="bg-gray-900 text-white p-3 print:bg-gray-200 print:text-black print:border-b print:border-black">
                    <h4 className="font-bold text-sm uppercase tracking-wide">
                      INVOICE SUMMARY
                    </h4>
                  </div>

                  <div className="divide-y divide-gray-200 print:divide-black">
                    <div className="p-4 flex justify-between items-center">
                      <span className="font-semibold text-gray-700">
                        Total Value (Excluding VAT):
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        ৳ {Number(sale.netOfVat).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 flex justify-between items-center bg-gray-50 print:bg-gray-100">
                      <span className="font-semibold text-gray-700">
                        VAT @ 15%:
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        ৳ {Number(sale.vatAmount).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 bg-gray-100 print:bg-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-900">
                          GRAND TOTAL (Inc. VAT):
                        </span>
                        <span className="font-mono font-bold text-xl text-gray-900">
                          ৳ {Number(sale.grandTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="bg-white border border-gray-200 print:border-black">
                  <div className="bg-gray-100 p-3 border-b border-gray-200 print:bg-gray-200 print:border-black">
                    <h5 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      Amount in Words
                    </h5>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-800 capitalize">
                      Taka {Number(sale.grandTotal).toLocaleString()} Only
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Signature Section */}
          <div className="p-3 bg-white border-t border-gray-200 print:border-black">
            {/* Single Line Signatures */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              {[
                { title: "PREPARED BY", subtitle: "Accounts" },
                { title: "CHECKED BY", subtitle: "Manager" },
                { title: "RECEIVED BY", subtitle: "Customer" },
              ].map((sig, index) => (
                <div key={index} className="text-center">
                  <div className="h-6 border-b border-gray-300 mb-1 print:border-black"></div>
                  <p className="font-bold text-xs text-gray-900 uppercase">
                    {sig.title}
                  </p>
                  <p className="text-xs text-gray-600">{sig.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Compact Footer */}
            <div className="text-center border-t border-gray-200 pt-2 print:border-black">
              <p className="text-xs text-gray-600">
                Computer generated invoice - No signature required | Generated:{" "}
                {new Date().toLocaleDateString("en-GB")} |{" "}
                {sale.companySettings?.taxpayer_name || "M S RAHMAN TRADERS"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
