"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingDown, Calendar, Package } from "lucide-react";

interface StockAnalysis {
  totalUnitsSold: number;
  totalRevenue: number;
  avgMonthlySales: number;
  currentMonth: {
    units: number;
    revenue: number;
    avgPerSale: number;
    transactions: number;
    products: number;
  };
}

export default function MonthlyStockAnalysis() {
  const [data, setData] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/analytics");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Stock Movement Analysis
          </h2>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {data.totalUnitsSold.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 font-medium mt-1">
              Total Units Sold
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              ৳{(data.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-blue-600 font-medium mt-1">
              Total Revenue
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {data.avgMonthlySales.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 font-medium mt-1">
              Avg Monthly Sales
            </div>
          </div>
        </div>

        {/* Current Month Details */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{monthName}</h3>
                <p className="text-xs text-gray-600">
                  {data.currentMonth.transactions} transactions •{" "}
                  {data.currentMonth.products} different products
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-red-600 font-semibold">
                <TrendingDown className="w-4 h-4" />
                <span className="text-lg">
                  {data.currentMonth.units.toLocaleString()} units
                </span>
              </div>
              <div className="text-xs text-gray-600">
                ৳{data.currentMonth.revenue.toLocaleString()} revenue
              </div>
              <div className="text-xs text-blue-600 font-medium">
                Avg: ৳{data.currentMonth.avgPerSale.toLocaleString()}/sale
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
