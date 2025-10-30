"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  unit: string;
  sellExVat: string;
  stockOnHand: number;
}

interface Customer {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  bin?: string;
  nid?: string;
}

interface SaleLine {
  id?: number;
  productId: number;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineAmount: number;
  lineTotal?: number; // API response field
}

interface Sale {
  id: number;
  invoiceNo: string;
  date: string;
  customer: string;
  customerId?: number;
  amountType: "INCL" | "EXCL";
  totalValue: string;
  notes?: string;
  saleLines: SaleLine[];
}

export default function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [saleId, setSaleId] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    invoiceNo: "",
    customer: "",
    customerId: null as number | null,
    amountType: "EXCL" as "INCL" | "EXCL", // Default to VAT Exclusive
    notes: "",
  });

  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    async function loadData() {
      try {
        // First resolve the params
        const { id } = await params;
        setSaleId(id);

        const [saleRes, productsRes, customersRes] = await Promise.all([
          fetch(`/api/sales/${id}`),
          fetch("/api/products"),
          fetch("/api/customers"),
        ]);

        if (saleRes.ok) {
          const saleData = await saleRes.json();
          setSale(saleData);
          setFormData({
            date: new Date(saleData.date).toISOString().split("T")[0],
            invoiceNo: saleData.invoiceNo,
            customer: saleData.customer,
            customerId: saleData.customerId || null,
            amountType: saleData.amountType || "EXCL", // Default to VAT Exclusive
            notes: saleData.notes || "",
          });
          // Map API data to component structure - use existing line totals
          const mappedSaleLines = (saleData.saleLines || []).map(
            (line: any) => {
              const qty = Number(line.qty || 0);
              const unitPrice = Number(line.unitPrice || 0);
              const lineAmount = Number(line.lineTotal || line.lineAmount || 0);

              return {
                id: line.id,
                productId: Number(line.productId || 0),
                productName: line.productName || "",
                unit: line.unit || "Pairs",
                qty,
                unitPrice,
                lineAmount,
              };
            }
          );
          setSaleLines(mappedSaleLines);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

  // Add product to sale lines
  const addSaleLine = () => {
    if (!selectedProductId || qty <= 0) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const unitPrice = Number(product.sellExVat);
    const lineAmount = qty * unitPrice;

    const newLine: SaleLine = {
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      qty,
      unitPrice,
      lineAmount,
    };

    setSaleLines([...saleLines, newLine]);
    setSelectedProductId(null);
    setQty(1);
  };

  // Remove sale line
  const removeSaleLine = (index: number) => {
    setSaleLines(saleLines.filter((_, i) => i !== index));
  };

  // Update sale line quantity
  const updateSaleLineQty = (index: number, newQty: number) => {
    const updatedLines = [...saleLines];
    updatedLines[index].qty = newQty;
    updatedLines[index].lineAmount = newQty * updatedLines[index].unitPrice;
    setSaleLines(updatedLines);
  };

  // Update sale line unit price
  const updateSaleLinePrice = (index: number, newPrice: number) => {
    const updatedLines = [...saleLines];
    updatedLines[index].unitPrice = newPrice;
    updatedLines[index].lineAmount = updatedLines[index].qty * newPrice;
    setSaleLines(updatedLines);
  };

  // Calculate totals - for edit page, just show the line totals
  // Don't recalculate VAT as it's already been calculated when the sale was created
  const subtotal = saleLines.reduce(
    (sum, line) => sum + Number(line.lineAmount || 0),
    0
  );

  // For display purposes only - these will be recalculated on server when saving
  const grandTotal = subtotal;
  const vatAmount =
    formData.amountType === "EXCL" ? subtotal * 0.15 : (subtotal * 15) / 115;
  const netOfVat =
    formData.amountType === "EXCL" ? subtotal : subtotal - vatAmount;

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    if (customerId) {
      const customer = customers.find((c) => c.id === parseInt(customerId));
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customerId: customer.id,
          customer: customer.name,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, customerId: null, customer: "" }));
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleLines.length === 0) {
      alert("Please add at least one product to the sale");
      return;
    }

    if (!formData.customer.trim()) {
      alert("Please select a customer");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formData.date,
          invoiceNo: formData.invoiceNo,
          customer: formData.customer,
          customerId: formData.customerId,
          amountType: formData.amountType,
          notes: formData.notes,
          lines: saleLines.map((line) => ({
            productId: line.productId,
            qty: line.qty,
            unitPrice: line.unitPrice,
            lineAmount: line.lineAmount,
            unit: line.unit,
          })),
          // Let the server calculate the totals based on the lines and amount type
        }),
      });

      if (response.ok) {
        router.push(`/sales/${saleId}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update sale: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      alert("Failed to update sale");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center space-x-4">
            <svg
              className="animate-spin h-8 w-8 text-orange-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Loading Sale
              </h3>
              <p className="text-gray-600">
                Please wait while we fetch the sale details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sale Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The sale you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/sales"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            ← Back to Sales
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Edit Sale
              </h1>
              <p className="text-gray-600 mt-1">
                Update sales invoice #{sale.invoiceNo}
              </p>
            </div>
            <Link
              href={`/sales/${sale.id}`}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              ← Back to Sale
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sale Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sale Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-200 bg-white/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Invoice No *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNo: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-200 bg-white/50"
                  placeholder="Invoice number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer *
                </label>
                <select
                  value={formData.customerId || ""}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-200 bg-white/50"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount Type
                </label>
                <select
                  value={formData.amountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amountType: e.target.value as "INCL" | "EXCL",
                    })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-200 bg-white/50"
                >
                  <option value="EXCL">VAT Exclusive</option>
                  <option value="INCL">VAT Inclusive</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-200 bg-white/50 resize-none"
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Add Products */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Add Products
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={selectedProductId || ""}
                  onChange={(e) =>
                    setSelectedProductId(Number(e.target.value) || null)
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 bg-white/50"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ৳
                      {Number(product.sellExVat).toLocaleString()} per{" "}
                      {product.unit}
                      (Stock: {product.stockOnHand} {product.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full lg:w-32">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 bg-white/50"
                  placeholder="Qty"
                />
              </div>

              <button
                type="button"
                onClick={addSaleLine}
                disabled={!selectedProductId || qty <= 0}
                className="w-full lg:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none"
              >
                Add Product
              </button>
            </div>
          </div>

          {/* Sale Lines */}
          {saleLines.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Sale Items
                    </h2>
                  </div>
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    <svg
                      className="w-4 h-4 inline mr-1 text-blue-600"
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
                    Edit quantity & price directly
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Line Amount
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {saleLines.map((line, index) => (
                      <tr
                        key={index}
                        className="hover:bg-orange-50/50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {line.productName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {line.unit}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.qty}
                            onChange={(e) =>
                              updateSaleLineQty(index, Number(e.target.value))
                            }
                            className="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                          <div className="flex items-center justify-end">
                            <span className="text-gray-500 mr-1">৳</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) =>
                                updateSaleLinePrice(
                                  index,
                                  Number(e.target.value)
                                )
                              }
                              className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">
                          ৳{Number(line.lineAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => removeSaleLine(index)}
                              className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                              title="Remove item"
                            >
                              <svg
                                className="w-3 h-3"
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
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Line Total:</span>
                      <span>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <svg
                        className="w-4 h-4 inline mr-1 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Final VAT calculation will be done when saving. This is
                      just a preview based on current line items.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Link
              href={`/sales/${sale.id}`}
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || saleLines.length === 0}
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating Sale...
                </>
              ) : (
                "Update Sale"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
