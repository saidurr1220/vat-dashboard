"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface EnhancedInvoiceProps {
  sale: any;
}

export default function EnhancedInvoice({ sale }: EnhancedInvoiceProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const numberToWords = (num: number): string => {
    // Simple number to words conversion for Bangladeshi Taka
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + numberToWords(num % 100) : "")
      );
    if (num < 100000)
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + numberToWords(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        numberToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + numberToWords(num % 100000) : "")
      );

    return (
      numberToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + numberToWords(num % 10000000) : "")
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Print Controls - Hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/sales/${sale.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sale
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Invoice #{sale.invoiceNo}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                {showPreview ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Print (Ctrl+P)
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Download className="w-4 h-4" />
                Save as PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Notice */}
      {showPreview && (
        <div className="print:hidden bg-amber-50 border-l-4 border-amber-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Print Preview Mode:</strong> This is how your invoice
                will look when printed. The design is optimized for A4 paper
                size.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Container */}
      <div className="container mx-auto px-4 py-8 print:p-0 print:m-0 print:w-full">
        <div className="max-w-4xl mx-auto print:max-w-none print:w-full print:mx-0">
          {/* Enhanced Invoice Design */}
          <div className="invoice-container bg-white shadow-2xl print:shadow-none border print:border-0 rounded-lg print:rounded-none overflow-hidden print:overflow-visible">
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 print:bg-gray-800">
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              {/* VAT Form Number */}
              <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                মূসক-৬.৩
              </div>

              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h1 className="text-4xl font-bold mb-2 tracking-wide">
                    TAX INVOICE
                  </h1>
                  <div className="space-y-2 text-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-200">Invoice No:</span>
                      <span className="font-mono font-bold text-xl bg-white/20 px-3 py-1 rounded">
                        {sale.invoiceNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-200">Date:</span>
                      <span className="font-mono font-semibold">
                        {new Date(sale.dt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                    <p className="text-lg font-bold mb-1">ORIGINAL FOR BUYER</p>
                    <p className="text-sm text-blue-100">
                      VAT Registration Certificate Required
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company & Customer Info with Enhanced Design */}
            <div className="p-8 bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Seller Information */}
                {sale.companySettings && (
                  <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        SELLER / SUPPLIER
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      <h4 className="text-xl font-bold text-gray-900 mb-3">
                        {sale.companySettings.taxpayer_name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-600 min-w-[60px]">
                            Address:
                          </span>
                          <span className="text-gray-800">
                            {sale.companySettings.address}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-600 min-w-[60px]">
                            BIN:
                          </span>
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {sale.companySettings.bin}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-600 min-w-[60px]">
                            VAT Reg:
                          </span>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                            ✓ Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyer Information */}
                <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      BUYER / CUSTOMER
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <h4 className="text-xl font-bold text-gray-900 mb-3">
                      {sale.customerName || sale.customer}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {sale.customerAddress && (
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-600 min-w-[60px]">
                            Address:
                          </span>
                          <span className="text-gray-800">
                            {sale.customerAddress}
                          </span>
                        </div>
                      )}
                      {sale.customerPhone && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-600 min-w-[60px]">
                            Phone:
                          </span>
                          <span className="font-mono text-gray-800">
                            {sale.customerPhone}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600 min-w-[60px]">
                          BIN:
                        </span>
                        {sale.customerBin ? (
                          <span className="font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            {sale.customerBin}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic bg-gray-50 px-2 py-1 rounded text-xs">
                            Not Provided
                          </span>
                        )}
                      </div>
                      {sale.customerNid && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-600 min-w-[60px]">
                            NID:
                          </span>
                          <span className="font-mono text-gray-800">
                            {sale.customerNid}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Items Table */}
            <div className="p-8">
              <div className="overflow-hidden rounded-lg shadow-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                      <th className="p-4 text-left font-bold text-sm border-r border-gray-600">
                        SL.
                      </th>
                      <th className="p-4 text-left font-bold text-sm border-r border-gray-600">
                        DESCRIPTION OF GOODS/SERVICES
                      </th>
                      <th className="p-4 text-center font-bold text-sm border-r border-gray-600">
                        HS CODE
                      </th>
                      <th className="p-4 text-center font-bold text-sm border-r border-gray-600">
                        UNIT
                      </th>
                      <th className="p-4 text-right font-bold text-sm border-r border-gray-600">
                        QTY
                      </th>
                      <th className="p-4 text-right font-bold text-sm border-r border-gray-600">
                        UNIT PRICE (৳)
                      </th>
                      <th className="p-4 text-right font-bold text-sm">
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
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="p-4 text-center font-mono font-semibold border-r border-gray-200">
                          {(index + 1).toString().padStart(2, "0")}
                        </td>
                        <td className="p-4 border-r border-gray-200">
                          <div className="font-semibold text-gray-900 text-base">
                            {line.productName}
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono text-sm border-r border-gray-200 text-gray-600">
                          {line.hsCode || "—"}
                        </td>
                        <td className="p-4 text-center font-semibold border-r border-gray-200">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {line.unit}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold border-r border-gray-200">
                          {Number(line.qty).toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-mono font-semibold border-r border-gray-200">
                          {Number(line.unitPrice).toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-lg text-gray-900">
                          {Number(line.lineTotal).toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {/* Empty rows for standard format */}
                    {Array.from({
                      length: Math.max(0, 3 - sale.saleLines.length),
                    }).map((_, index) => (
                      <tr key={`empty-${index}`} className="bg-gray-25 h-12">
                        <td className="p-4 border-r border-gray-200">&nbsp;</td>
                        <td className="p-4 border-r border-gray-200">&nbsp;</td>
                        <td className="p-4 border-r border-gray-200">&nbsp;</td>
                        <td className="p-4 border-r border-gray-200">&nbsp;</td>
                        <td className="p-4 border-r border-gray-200">&nbsp;</td>
                        <td className="p-4 border-r border-gray-200">&nbsp;</td>
                        <td className="p-4">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enhanced Totals & Payment Section */}
            <div className="p-8 bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Terms & Notes */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      PAYMENT TERMS
                    </h4>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded border">
                      💰 Cash Payment
                    </p>
                  </div>

                  {sale.notes && (
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        REMARKS
                      </h4>
                      <p className="text-gray-700 bg-purple-50 p-3 rounded border italic">
                        {sale.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Totals */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
                      <h4 className="font-bold text-lg">INVOICE SUMMARY</h4>
                    </div>

                    <div className="divide-y divide-gray-200">
                      <div className="p-4 flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          Total Value (Excluding VAT):
                        </span>
                        <span className="font-mono font-bold text-lg text-gray-900">
                          ৳ {Number(sale.netOfVat).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-4 flex justify-between items-center bg-orange-50">
                        <span className="font-semibold text-orange-700">
                          VAT @ 15%:
                        </span>
                        <span className="font-mono font-bold text-lg text-orange-700">
                          ৳ {Number(sale.vatAmount).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xl text-green-800">
                            GRAND TOTAL (Inc. VAT):
                          </span>
                          <span className="font-mono font-bold text-2xl text-green-800">
                            ৳ {Number(sale.grandTotal).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount in Words */}
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      Amount in Words:
                    </h5>
                    <div className="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300">
                      <p className="font-semibold text-gray-800 capitalize">
                        {numberToWords(Math.floor(Number(sale.grandTotal)))}{" "}
                        Taka Only
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Signature Section */}
            <div className="p-8 bg-white border-t-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "PREPARED BY", subtitle: "Accounts Department" },
                  { title: "CHECKED BY", subtitle: "Manager" },
                  { title: "RECEIVED BY", subtitle: "Customer" },
                ].map((sig, index) => (
                  <div key={index} className="text-center">
                    <div className="h-20 border-b-2 border-dashed border-gray-300 mb-4 flex items-end justify-center">
                      <span className="text-xs text-gray-400 mb-1">
                        Signature
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-gray-900">
                        {sig.title}
                      </p>
                      <p className="text-xs text-gray-600">{sig.subtitle}</p>
                      <p className="text-xs text-gray-400">Date: ___________</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  This is a computer generated invoice. No signature required.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Generated on {new Date().toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles - Optimized for A4 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.3in;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 10px !important;
            line-height: 1.1 !important;
            width: 100% !important;
            height: auto !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .container,
          .max-w-4xl {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .shadow-2xl,
          .shadow-lg,
          .shadow-md,
          .rounded-lg,
          .rounded {
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .p-8 {
            padding: 8px !important;
          }
          .p-6 {
            padding: 6px !important;
          }
          .p-4 {
            padding: 4px !important;
          }

          .bg-gradient-to-r {
            background: #1f2937 !important;
            color: white !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9px !important;
            margin: 0 !important;
          }

          th,
          td {
            padding: 2px 3px !important;
            border: 1px solid #000 !important;
            font-size: 9px !important;
            line-height: 1.1 !important;
          }

          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }

          .grid-cols-1.lg\\:grid-cols-2 {
            grid-template-columns: 1fr 1fr !important;
          }

          .grid-cols-1.md\\:grid-cols-3 {
            grid-template-columns: 1fr 1fr 1fr !important;
          }

          .text-4xl {
            font-size: 18px !important;
          }
          .text-3xl {
            font-size: 16px !important;
          }
          .text-2xl {
            font-size: 14px !important;
          }
          .text-xl {
            font-size: 12px !important;
          }
          .text-lg {
            font-size: 11px !important;
          }
          .text-base {
            font-size: 10px !important;
          }
          .text-sm {
            font-size: 9px !important;
          }
          .text-xs {
            font-size: 8px !important;
          }

          .gap-8 {
            gap: 6px !important;
          }
          .gap-6 {
            gap: 4px !important;
          }
          .gap-4 {
            gap: 3px !important;
          }
          .gap-3 {
            gap: 2px !important;
          }
          .gap-2 {
            gap: 1px !important;
          }

          .space-y-6 > * + * {
            margin-top: 4px !important;
          }
          .space-y-4 > * + * {
            margin-top: 3px !important;
          }
          .space-y-3 > * + * {
            margin-top: 2px !important;
          }
          .space-y-2 > * + * {
            margin-top: 1px !important;
          }

          .mb-3 {
            margin-bottom: 2px !important;
          }
          .mb-2 {
            margin-bottom: 1px !important;
          }
          .mt-8 {
            margin-top: 6px !important;
          }
          .pt-6 {
            padding-top: 4px !important;
          }

          .h-20 {
            height: 25px !important;
          }

          .invoice-container {
            page-break-inside: avoid;
            width: 100% !important;
          }

          /* Force single page layout */
          .min-h-screen {
            min-height: auto !important;
          }

          /* Add print-specific utility classes */
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print\\:mx-0 {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .print\\:overflow-visible {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
