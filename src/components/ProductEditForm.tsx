"use client";

import { useState } from "react";
import { showToast } from "@/lib/toast-helpers";

interface Product {
  id: number;
  name: string;
  testsPerKit: number | null;
  sellExVat: string | null;
}

interface ProductEditFormProps {
  product: Product;
}

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testsPerKit, setTestsPerKit] = useState(product.testsPerKit || 120);
  const [sellExVat, setSellExVat] = useState(product.sellExVat || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testsPerKit: testsPerKit,
          sellExVat: sellExVat,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      setIsOpen(false);
      showToast.success("Product updated successfully!");
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error("Error updating product:", error);
      showToast.error("Error updating product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isBioShield = product.name.toLowerCase().includes("bioshield");

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
            <p className="text-sm text-gray-600 mb-4">{product.name}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (Ex-VAT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sellExVat}
                  onChange={(e) => setSellExVat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {isBioShield && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tests per Kit
                  </label>
                  <input
                    type="number"
                    value={testsPerKit}
                    onChange={(e) =>
                      setTestsPerKit(parseInt(e.target.value) || 120)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Per-test price: ৳
                    {testsPerKit > 0
                      ? (Number(sellExVat) / testsPerKit).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
