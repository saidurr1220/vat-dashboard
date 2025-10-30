"use client";

import { useState } from "react";
import { showToast } from "@/lib/toast-helpers";

interface StockEditFormProps {
  product: {
    id: number;
    name: string;
    unit: string;
    stockOnHand: number;
  };
}

export default function StockEditForm({ product }: StockEditFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      showToast.warning("Please enter a valid quantity");
      return;
    }

    if (!reason.trim()) {
      showToast.warning("Please provide a reason for the adjustment");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          adjustmentType,
          quantity,
          reason: reason.trim(),
        }),
      });

      if (response.ok) {
        showToast.success("Stock adjustment successful");
        setIsOpen(false);
        setQuantity(0);
        setReason("");
        // Refresh the page to show updated stock
        window.location.reload();
      } else {
        const error = await response.text();
        showToast.error(`Failed to adjust stock: ${error}`);
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      showToast.error("Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
      >
        Adjust Stock
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Adjust Stock</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Product:</div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">
                Current Stock: {product.stockOnHand.toLocaleString()}{" "}
                {product.unit}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) =>
                    setAdjustmentType(e.target.value as "IN" | "OUT")
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IN">Stock In (+)</option>
                  <option value="OUT">Stock Out (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Physical count adjustment, Damaged goods, etc."
                  required
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">Preview:</div>
                <div className="font-medium">
                  {adjustmentType === "IN" ? "Add" : "Remove"}{" "}
                  {quantity.toLocaleString()} {product.unit}
                </div>
                <div className="text-sm text-gray-500">
                  New Stock:{" "}
                  {adjustmentType === "IN"
                    ? (product.stockOnHand + quantity).toLocaleString()
                    : (product.stockOnHand - quantity).toLocaleString()}{" "}
                  {product.unit}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || quantity <= 0 || !reason.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {isSubmitting ? "Adjusting..." : "Adjust Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
