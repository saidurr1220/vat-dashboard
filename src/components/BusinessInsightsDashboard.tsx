"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Activity,
  Award,
  BarChart3,
} from "lucide-react";

interface BusinessInsights {
  overall: {
    totalUnitsSold: number;
    totalRevenue: number;
    totalTransactions: number;
    uniqueCustomers: number;
    productsSold: number;
  };
  currentMonth: {
    units: number;
    revenue: number;
    transactions: number;
    customers: number;
    products: number;
    avgPerTransaction: number;
  };
  growth: {
    revenue: string;
    units: string;
  };
  topProducts: Array<{
    name: string;
    category: string;
    qtySold: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    name: string;
    transactions: number;
    revenue: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    products: number;
    unitsSold: number;
    revenue: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    units: number;
    revenue: number;
    transactions: number;
  }>;
  vat: {
    totalSalesValue: number;
    totalVatCollected: number;
  };
}

export default function BusinessInsightsDashboard() {
  const [data, setData] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/business-insights");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load business insights:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const revenueGrowth = parseFloat(data.growth.revenue);
  const unitsGrowth = parseFloat(data.growth.units);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
              Business Analytics Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 truncate">
              M S RAHMAN TRADERS - {monthName}
            </p>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Month Revenue */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            {revenueGrowth !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs sm:text-sm font-semibold ${
                  revenueGrowth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {revenueGrowth > 0 ? (
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                {Math.abs(revenueGrowth)}%
              </div>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
            ৳{(data.currentMonth.revenue / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            Monthly Revenue
          </div>
          <div className="text-xs text-gray-500 mt-2 truncate">
            Avg: ৳{data.currentMonth.avgPerTransaction.toLocaleString()}
            /transaction
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            {unitsGrowth !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs sm:text-sm font-semibold ${
                  unitsGrowth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {unitsGrowth > 0 ? (
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                {Math.abs(unitsGrowth)}%
              </div>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
            {data.currentMonth.units.toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Units Sold</div>
          <div className="text-xs text-gray-500 mt-2">
            {data.currentMonth.products} different products
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
            {data.currentMonth.transactions}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Transactions</div>
          <div className="text-xs text-gray-500 mt-2">
            {data.currentMonth.customers} customers
          </div>
        </div>

        {/* VAT Collected */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
            ৳{(data.vat.totalVatCollected / 1000).toFixed(0)}K
          </div>
          <div className="text-xs sm:text-sm text-gray-600">VAT Collected</div>
          <div className="text-xs text-gray-500 mt-2 truncate">
            15% of ৳{(data.vat.totalSalesValue / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Top 5 Products</h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">By revenue this month</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {data.topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {product.category} • {product.qtySold} units
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                      ৳{(product.revenue / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Top 5 Customers</h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">By revenue this month</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {data.topCustomers.map((customer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-purple-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {customer.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.transactions} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                      ৳{(customer.revenue / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">
              Category Performance
            </h3>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Sales breakdown by category
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {data.categoryPerformance.map((cat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-3 sm:p-4 border border-gray-200"
              >
                <div className="text-sm sm:text-lg font-bold text-gray-900 mb-1 truncate">
                  {cat.category || "Uncategorized"}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2 truncate">
                  ৳{(cat.revenue / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="truncate">
                    {cat.unitsSold.toLocaleString()} units sold
                  </div>
                  <div>{cat.products} products</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">6-Month Trend</h3>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Revenue and units sold over time
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                    Month
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">
                    Revenue
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">
                    Units
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyTrend.map((month, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3 text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-gray-900">
                      ৳{(month.revenue / 1000).toFixed(0)}K
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-gray-900">
                      {month.units.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-gray-900">
                      {month.transactions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overall Stats Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">
          All-Time Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              ৳{(data.overall.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-600 mt-1">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {data.overall.totalUnitsSold.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-1">Units Sold</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {data.overall.totalTransactions}
            </div>
            <div className="text-xs text-gray-600 mt-1">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {data.overall.uniqueCustomers}
            </div>
            <div className="text-xs text-gray-600 mt-1">Customers</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {data.overall.productsSold}
            </div>
            <div className="text-xs text-gray-600 mt-1">Products</div>
          </div>
        </div>
      </div>
    </div>
  );
}
