"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  unit: string;
  stockOnHand: number;
}

export default function StockAdjustPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    adjustmentType: "IN" as "IN" | "OUT",
    quantity: "",
    reason: "",
  });

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || !formData.quantity || !formData.reason.trim()) {
      alert("Please fill in all fields");
      return;
    }

    const product = products.find((p) => p.id === parseInt(formData.productId));
    if (!product) return;

    const adjustmentQty = parseInt(formData.quantity);
    if (
      formData.adjustmentType === "OUT" &&
      adjustmentQty > product.stockOnHand
    ) {
      alert(
        `Cannot adjust out more than available stock (${product.stockOnHand})`
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: parseInt(formData.productId),
          adjustmentType: formData.adjustmentType,
          quantity: adjustmentQty,
          reason: formData.reason,
        }),
      });

      if (response.ok) {
        alert("Stock adjustment saved successfully!");
        router.push("/products");
      } else {
        const errorData = await response.json();
        alert(`Failed to adjust stock: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center space-x-4">
            <svg
              className="animate-spin h-8 w-8 text-purple-600"
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
                Loading Stock Adjustment
              </h3>
              <p className="text-gray-600">
                Please wait while we prepare the form...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedProduct = products.find(
    (p) => p.id === parseInt(formData.productId)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Stock Adjustment
              </h1>
              <p className="text-gray-600 mt-1">Adjust product stock levels</p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              ← Back to Products
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
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
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0V4a1 1 0 011-1h6a1 1 0 011 1v0M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h6l4 4v8a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Adjustment Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 bg-white/50"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Current Stock: {product.stockOnHand}{" "}
                      {product.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adjustment Type *
                </label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      adjustmentType: e.target.value as "IN" | "OUT",
                    })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 bg-white/50"
                  required
                >
                  <option value="IN">Stock In (Increase)</option>
                  <option value="OUT">Stock Out (Decrease)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 bg-white/50"
                  placeholder="Enter quantity"
                  required
                />
              </div>

              {selectedProduct && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-700 mb-1">
                    Current Stock
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {selectedProduct.stockOnHand} {selectedProduct.unit}
                  </p>
                  {formData.quantity && (
                    <p className="text-sm text-blue-600 mt-2">
                      After adjustment:{" "}
                      <span className="font-semibold">
                        {formData.adjustmentType === "IN"
                          ? selectedProduct.stockOnHand +
                            parseInt(formData.quantity || "0")
                          : selectedProduct.stockOnHand -
                            parseInt(formData.quantity || "0")}{" "}
                        {selectedProduct.unit}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 bg-white/50 resize-none"
                  placeholder="Reason for stock adjustment"
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none"
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
                  Adjusting Stock...
                </>
              ) : (
                "Adjust Stock"
              )}
            </button>
          </div>
        </form>

        {/* Information Card */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Stock Adjustment Guidelines
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-green-600 mt-1 flex-shrink-0"
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
                <div>
                  <p className="font-semibold text-green-900 mb-2">
                    Stock In (Increase)
                  </p>
                  <p className="text-sm text-green-700">
                    Use when receiving new inventory, returns, or corrections
                    for undercounted stock
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-red-600 mt-1 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-red-900 mb-2">
                    Stock Out (Decrease)
                  </p>
                  <p className="text-sm text-red-700">
                    Use for damaged goods, theft, loss, or corrections for
                    overcounted stock
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
