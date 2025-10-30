"use client";

import { useState, useEffect } from "react";

interface StockItem {
  id: number;
  name: string;
  unit: string;
  stockOnHand: number;
  stockValue: number;
  stockValueVat: number;
  stockValueIncVat: number;
}

interface StockSummaryData {
  items: StockItem[];
  totals: {
    totalStockValue: number;
    totalStockValueVat: number;
    totalStockValueIncVat: number;
  };
}

export default function StockSummary() {
  const [stockData, setStockData] = useState<StockSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStockSummary() {
      try {
        const response = await fetch("/api/stock/summary");
        if (response.ok) {
          const data = await response.json();
          setStockData(data);
        }
      } catch (error) {
        console.error("Failed to fetch stock summary:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStockSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Stock Summary</h2>
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Stock Summary</h2>
        <div className="text-center text-gray-500">
          Failed to load stock data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Stock Summary</h2>
      </div>

      <div className="p-6">
        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800">
              Stock Value (Ex VAT)
            </h3>
            <p className="text-2xl font-bold text-blue-900">
              ৳{stockData.totals.totalStockValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800">VAT Amount</h3>
            <p className="text-2xl font-bold text-green-900">
              ৳{stockData.totals.totalStockValueVat.toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800">
              Stock Value (Inc VAT)
            </h3>
            <p className="text-2xl font-bold text-purple-900">
              ৳{stockData.totals.totalStockValueIncVat.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value (Ex VAT)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VAT
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value (Inc VAT)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockData.items
                .filter((item) => item.stockOnHand > 0)
                .map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {item.stockOnHand.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      ৳{item.stockValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      ৳{item.stockValueVat.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      ৳{item.stockValueIncVat.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
