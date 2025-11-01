"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Printer, Edit, Trash2, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SaleActionsProps {
  sale: {
    id: number;
    invoiceNo: string;
    date: string;
    customer: string;
    customerName?: string;
    customerAddress?: string;
    customerPhone?: string;
    customerBin?: string;
    saleLines: any[];
    netOfVat: number;
    vatAmount: number;
    grandTotal: number;
  };
}

export default function SaleActions({ sale }: SaleActionsProps) {
  const { showSuccess, showError } = useToast();
  const handlePrintFormatted = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${sale.invoiceNo}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-details { margin-bottom: 20px; }
              .customer-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .totals { text-align: right; }
              .total-row { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <h2>M S RAHMAN TRADERS</h2>
              <p>174. Siddique Bazar, Dhaka</p>
              <p>BIN: 004223577-0205</p>
            </div>
            
            <div class="invoice-details">
              <p><strong>Invoice No:</strong> ${sale.invoiceNo}</p>
              <p><strong>Date:</strong> ${new Date(
                sale.date
              ).toLocaleDateString("en-GB")}</p>
            </div>
            
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${sale.customerName || sale.customer}</strong></p>
              ${sale.customerAddress ? `<p>${sale.customerAddress}</p>` : ""}
              ${sale.customerPhone ? `<p>Phone: ${sale.customerPhone}</p>` : ""}
              ${sale.customerBin ? `<p>BIN: ${sale.customerBin}</p>` : ""}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${sale.saleLines
                  .map(
                    (line: any) => `
                  <tr>
                    <td>${line.productName}</td>
                    <td>${line.unit}</td>
                    <td>${Number(line.qty).toLocaleString()}</td>
                    <td>৳${Number(line.unitPrice).toLocaleString()}</td>
                    <td>৳${Number(line.lineTotal).toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="totals">
              <p>Subtotal: ৳${Number(sale.netOfVat).toLocaleString()}</p>
              <p>VAT (15%): ৳${Number(sale.vatAmount).toLocaleString()}</p>
              <p class="total-row">Total: ৳${Number(
                sale.grandTotal
              ).toLocaleString()}</p>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
              <p>Thank you for your business!</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDelete = async () => {
    // Show confirmation toast first
    const confirmed = confirm(
      `Are you sure you want to delete sale ${sale.invoiceNo}? This will restore the stock and cannot be undone.`
    );

    if (!confirmed) return;

    try {
      console.log(`Attempting to delete sale ${sale.id}`);

      const response = await fetch(`/api/sales/${sale.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`Delete response status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log("Delete successful:", result);

        showSuccess(
          "Sale Deleted",
          "Sale deleted and stock restored successfully!"
        );

        // Use router instead of window.location for better UX
        setTimeout(() => {
          window.location.href = "/sales";
        }, 1000);
      } else {
        const error = await response.json();
        console.error("Delete failed:", error);
        showError("Delete Failed", error.error || "Failed to delete sale");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Delete Failed", "Network error occurred while deleting sale");
    }
  };

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Print Invoice
      </button>
      <button
        onClick={handlePrintFormatted}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Print Formatted
      </button>

      <Link href={`/sales/${sale.id}/invoice`}>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 gap-2">
          <Sparkles className="w-4 h-4" />
          Enhanced Invoice
        </Button>
      </Link>
      <Link
        href={`/sales/${sale.id}/edit`}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Edit Sale
      </Link>
      <button
        onClick={handleDelete}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Delete Sale
      </button>
      <Link
        href="/sales"
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Sales
      </Link>
    </div>
  );
}
