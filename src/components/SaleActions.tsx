"use client";

import Link from "next/link";

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
    if (
      confirm(
        "Are you sure you want to delete this sale? This will restore the stock."
      )
    ) {
      try {
        const response = await fetch(`/api/sales/${sale.id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          alert("Sale deleted and stock restored successfully!");
          window.location.href = "/sales";
        } else {
          const error = await response.json();
          alert(`Failed to delete sale: ${error.error}`);
        }
      } catch (error) {
        alert("Failed to delete sale");
      }
    }
  };

  return (
    <div className="flex gap-2 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Print Invoice
      </button>
      <button
        onClick={handlePrintFormatted}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Print Formatted
      </button>
      <Link
        href={`/sales/${sale.id}/edit`}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Edit Sale
      </Link>
      <button
        onClick={handleDelete}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Delete Sale
      </button>
      <Link
        href="/sales"
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Back to Sales
      </Link>
    </div>
  );
}
