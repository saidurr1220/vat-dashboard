import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import SaleActionsWrapper from "@/components/SaleActionsWrapper";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Invoice Details
              </h1>
              <p className="text-gray-600 mt-1">Invoice #{sale.invoiceNo}</p>
            </div>
            <SaleActionsWrapper sale={sale} />
          </div>
        </div>

        {/* VAT 6.3 Standard Invoice - Original Copy */}
        <div className="bg-white shadow-2xl border-2 border-gray-300 print:shadow-none print:border-gray-400 mb-8">
          {/* VAT 6.3 Header */}
          <div className="relative border-b-2 border-gray-400 p-6">
            {/* মূসক-৬.৩ in upper right corner */}
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-sm font-bold">
              মূসক-৬.৩
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  TAX INVOICE
                </h1>
                <div className="text-lg font-semibold text-gray-700">
                  <p>
                    Invoice No:{" "}
                    <span className="font-mono text-blue-600">
                      {sale.invoiceNo}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    <span className="font-mono">
                      {new Date(sale.date).toLocaleDateString("en-GB")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-gray-100 p-4 border border-gray-300">
                  <p className="text-sm font-semibold text-gray-600 mb-1">
                    ORIGINAL FOR BUYER
                  </p>
                  <p className="text-xs text-gray-500">
                    VAT Registration Certificate Required
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VAT 6.3 Seller and Buyer Information */}
          <div className="border-b-2 border-gray-400 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Seller Information */}
              {sale.companySettings && (
                <div className="border-2 border-gray-300 p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 bg-gray-100 p-2 border-b border-gray-300">
                    SELLER / SUPPLIER
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-base text-gray-900">
                      {sale.companySettings.taxpayer_name}
                    </p>
                    <p className="text-gray-700">
                      <strong>Address:</strong> {sale.companySettings.address}
                    </p>
                    <p className="text-gray-700">
                      <strong>BIN:</strong>{" "}
                      <span className="font-mono font-bold">
                        {sale.companySettings.bin}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      <strong>VAT Registration:</strong>{" "}
                      <span className="text-green-600 font-semibold">
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Buyer Information */}
              <div className="border-2 border-gray-300 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 bg-gray-100 p-2 border-b border-gray-300">
                  BUYER / CUSTOMER
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-base text-gray-900">
                    {sale.customerName || sale.customer}
                  </p>
                  {sale.customerAddress && (
                    <p className="text-gray-700">
                      <strong>Address:</strong> {sale.customerAddress}
                    </p>
                  )}
                  {sale.customerPhone && (
                    <p className="text-gray-700">
                      <strong>Phone:</strong> {sale.customerPhone}
                    </p>
                  )}
                  {sale.customerBin ? (
                    <p className="text-gray-700">
                      <strong>BIN:</strong>{" "}
                      <span className="font-mono font-bold">
                        {sale.customerBin}
                      </span>
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">BIN: Not Provided</p>
                  )}
                  {sale.customerNid && (
                    <p className="text-gray-700">
                      <strong>NID:</strong>{" "}
                      <span className="font-mono">{sale.customerNid}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VAT 6.3 Items Table */}
          <div className="border-b-2 border-gray-400 p-6">
            <table className="w-full border-2 border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 p-3 text-left font-bold text-sm">
                    SL. NO.
                  </th>
                  <th className="border border-gray-400 p-3 text-left font-bold text-sm">
                    DESCRIPTION OF GOODS/SERVICES
                  </th>
                  <th className="border border-gray-400 p-3 text-center font-bold text-sm">
                    HS CODE
                  </th>
                  <th className="border border-gray-400 p-3 text-center font-bold text-sm">
                    UNIT
                  </th>
                  <th className="border border-gray-400 p-3 text-right font-bold text-sm">
                    QTY
                  </th>
                  <th className="border border-gray-400 p-3 text-right font-bold text-sm">
                    UNIT PRICE (৳)
                  </th>
                  <th className="border border-gray-400 p-3 text-right font-bold text-sm">
                    TOTAL VALUE (৳)
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.saleLines.map((line: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-3 text-center font-mono">
                      {(index + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="border border-gray-400 p-3">
                      <div className="font-semibold text-gray-900">
                        {line.productName}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-3 text-center font-mono text-sm">
                      {line.hsCode || "N/A"}
                    </td>
                    <td className="border border-gray-400 p-3 text-center">
                      {line.unit}
                    </td>
                    <td className="border border-gray-400 p-3 text-right font-mono">
                      {Number(line.qty).toLocaleString()}
                    </td>
                    <td className="border border-gray-400 p-3 text-right font-mono">
                      {Number(line.unitPrice).toLocaleString()}
                    </td>
                    <td className="border border-gray-400 p-3 text-right font-mono font-bold">
                      {Number(line.lineTotal).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {/* Empty rows for standard format */}
                {Array.from({
                  length: Math.max(0, 5 - sale.saleLines.length),
                }).map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td className="border border-gray-400 p-3 text-center">
                      &nbsp;
                    </td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VAT 6.3 Totals Section */}
          <div className="border-b-2 border-gray-400 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">PAYMENT TERMS:</h4>
                <p className="text-sm text-gray-700">Cash Payment</p>

                {sale.notes && (
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-900 mb-2">REMARKS:</h4>
                    <p className="text-sm text-gray-700">{sale.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <table className="w-full border-2 border-gray-400">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                        TOTAL VALUE (EXCLUDING VAT):
                      </td>
                      <td className="border border-gray-400 p-2 text-right font-mono font-bold">
                        ৳ {Number(sale.netOfVat).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                        VAT @ 15%:
                      </td>
                      <td className="border border-gray-400 p-2 text-right font-mono font-bold">
                        ৳ {Number(sale.vatAmount).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="border border-gray-400 p-2 font-bold text-lg">
                        TOTAL VALUE (INCLUDING VAT):
                      </td>
                      <td className="border border-gray-400 p-2 text-right font-mono font-bold text-lg">
                        ৳ {Number(sale.grandTotal).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Amount in Words:</strong>
                  </p>
                  <p className="italic border border-gray-300 p-2 bg-gray-50">
                    {/* You can add number to words conversion here */}
                    Taka {Number(sale.grandTotal).toLocaleString()} Only
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VAT 6.3 Signature Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 mt-16 pt-2">
                  <p className="font-semibold text-sm">PREPARED BY</p>
                  <p className="text-xs text-gray-600 mt-1">Signature & Date</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t-2 border-gray-400 mt-16 pt-2">
                  <p className="font-semibold text-sm">CHECKED BY</p>
                  <p className="text-xs text-gray-600 mt-1">Signature & Date</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t-2 border-gray-400 mt-16 pt-2">
                  <p className="font-semibold text-sm">RECEIVED BY</p>
                  <p className="text-xs text-gray-600 mt-1">Signature & Date</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center border-t-2 border-gray-400 pt-4">
              <p className="text-xs text-gray-600">
                This is a computer generated invoice and does not require
                physical signature.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                For any queries, please contact:{" "}
                {sale.companySettings?.taxpayer_name || "M S RAHMAN TRADERS"}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Copy */}
        <div className="bg-white shadow-2xl border-2 border-gray-300 print:shadow-none print:border-gray-400 print:page-break-before">
          {/* VAT 6.3 Header - Customer Copy */}
          <div className="relative border-b-2 border-gray-400 p-6">
            {/* মূসক-৬.৩ in upper right corner */}
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 text-sm font-bold">
              মূসক-৬.৩
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  TAX INVOICE
                </h1>
                <div className="text-lg font-semibold text-gray-700">
                  <p>
                    Invoice No:{" "}
                    <span className="font-mono text-blue-600">
                      {sale.invoiceNo}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    <span className="font-mono">
                      {new Date(sale.date).toLocaleDateString("en-GB")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-blue-100 p-4 border border-blue-300">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    DUPLICATE FOR SELLER
                  </p>
                  <p className="text-xs text-blue-600">Customer Copy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seller and Buyer Information - Customer Copy */}
          <div className="border-b-2 border-gray-400 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Seller Information */}
              {sale.companySettings && (
                <div className="border-2 border-gray-300 p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 bg-gray-100 p-2 border-b border-gray-300">
                    SELLER / SUPPLIER
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-base text-gray-900">
                      {sale.companySettings.taxpayer_name}
                    </p>
                    <p className="text-gray-700">
                      <strong>Address:</strong> {sale.companySettings.address}
                    </p>
                    <p className="text-gray-700">
                      <strong>BIN:</strong>{" "}
                      <span className="font-mono font-bold">
                        {sale.companySettings.bin}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      <strong>VAT Registration:</strong>{" "}
                      <span className="text-green-600 font-semibold">
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Buyer Information */}
              <div className="border-2 border-gray-300 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 bg-gray-100 p-2 border-b border-gray-300">
                  BUYER / CUSTOMER
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-base text-gray-900">
                    {sale.customerName || sale.customer}
                  </p>
                  {sale.customerAddress && (
                    <p className="text-gray-700">
                      <strong>Address:</strong> {sale.customerAddress}
                    </p>
                  )}
                  {sale.customerPhone && (
                    <p className="text-gray-700">
                      <strong>Phone:</strong> {sale.customerPhone}
                    </p>
                  )}
                  {sale.customerBin ? (
                    <p className="text-gray-700">
                      <strong>BIN:</strong>{" "}
                      <span className="font-mono font-bold">
                        {sale.customerBin}
                      </span>
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">BIN: Not Provided</p>
                  )}
                  {sale.customerNid && (
                    <p className="text-gray-700">
                      <strong>NID:</strong>{" "}
                      <span className="font-mono">{sale.customerNid}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table - Customer Copy */}
          <div className="border-b-2 border-gray-400 p-6">
            <table className="w-full border-2 border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 p-3 text-left font-bold text-sm">
                    SL. NO.
                  </th>
                  <th className="border border-gray-400 p-3 text-left font-bold text-sm">
                    DESCRIPTION OF GOODS/SERVICES
                  </th>
                  <th className="border border-gray-400 p-3 text-center font-bold text-sm">
                    HS CODE
                  </th>
                  <th className="border border-gray-400 p-3 text-center font-bold text-sm">
                    UNIT
                  </th>
                  <th className="border border-gray-400 p-3 text-right font-bold text-sm">
                    QTY
                  </th>
                  <th className="border border-gray-400 p-3 text-right font-bold text-sm">
                    UNIT PRICE (৳)
                  </th>
                  <th className="border border-gray-400 p-3 text-right font-bold text-sm">
                    TOTAL VALUE (৳)
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.saleLines.map((line: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-3 text-center font-mono">
                      {(index + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="border border-gray-400 p-3">
                      <div className="font-semibold text-gray-900">
                        {line.productName}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-3 text-center font-mono text-sm">
                      {line.hsCode || "N/A"}
                    </td>
                    <td className="border border-gray-400 p-3 text-center">
                      {line.unit}
                    </td>
                    <td className="border border-gray-400 p-3 text-right font-mono">
                      {Number(line.qty).toLocaleString()}
                    </td>
                    <td className="border border-gray-400 p-3 text-right font-mono">
                      {Number(line.unitPrice).toLocaleString()}
                    </td>
                    <td className="border border-gray-400 p-3 text-right font-mono font-bold">
                      {Number(line.lineTotal).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {/* Empty rows for standard format */}
                {Array.from({
                  length: Math.max(0, 5 - sale.saleLines.length),
                }).map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td className="border border-gray-400 p-3 text-center">
                      &nbsp;
                    </td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section - Customer Copy */}
          <div className="border-b-2 border-gray-400 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">PAYMENT TERMS:</h4>
                <p className="text-sm text-gray-700">Cash Payment</p>

                {sale.notes && (
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-900 mb-2">REMARKS:</h4>
                    <p className="text-sm text-gray-700">{sale.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <table className="w-full border-2 border-gray-400">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                        TOTAL VALUE (EXCLUDING VAT):
                      </td>
                      <td className="border border-gray-400 p-2 text-right font-mono font-bold">
                        ৳ {Number(sale.netOfVat).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                        VAT @ 15%:
                      </td>
                      <td className="border border-gray-400 p-2 text-right font-mono font-bold">
                        ৳ {Number(sale.vatAmount).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="border border-gray-400 p-2 font-bold text-lg">
                        TOTAL VALUE (INCLUDING VAT):
                      </td>
                      <td className="border border-gray-400 p-2 text-right font-mono font-bold text-lg">
                        ৳ {Number(sale.grandTotal).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Amount in Words:</strong>
                  </p>
                  <p className="italic border border-gray-300 p-2 bg-gray-50">
                    Taka {Number(sale.grandTotal).toLocaleString()} Only
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section - Customer Copy */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 mt-16 pt-2">
                  <p className="font-semibold text-sm">PREPARED BY</p>
                  <p className="text-xs text-gray-600 mt-1">Signature & Date</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t-2 border-gray-400 mt-16 pt-2">
                  <p className="font-semibold text-sm">CHECKED BY</p>
                  <p className="text-xs text-gray-600 mt-1">Signature & Date</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t-2 border-gray-400 mt-16 pt-2">
                  <p className="font-semibold text-sm">RECEIVED BY</p>
                  <p className="text-xs text-gray-600 mt-1">Signature & Date</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center border-t-2 border-gray-400 pt-4">
              <p className="text-xs text-gray-600">
                This is a computer generated invoice and does not require
                physical signature.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                For any queries, please contact:{" "}
                {sale.companySettings?.taxpayer_name || "M S RAHMAN TRADERS"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
