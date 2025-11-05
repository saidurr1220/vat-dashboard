"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Sale {
  id: number;
  invoiceNo: string;
  dt: string;
  customer: string;
  customerDisplay: string;
  amountType: string;
  totalValue: string;
  vatAmount: string;
  netOfVat: string;
  grandTotal: string;
  itemCount: number;
  totalQuantity: number;
}

interface CategoryBreakdown {
  category: string;
  hsCode: string;
  saleCount: number;
  totalQuantity: number;
  netSales: string;
  vatAmount: string;
  grossSales: string;
}

interface SalesHistory {
  sales: Sale[];
  summary: {
    totalSales: number;
    totalRevenue: number;
    avgSaleValue: number;
  };
  categoryBreakdown: CategoryBreakdown[];
  filters: {
    year: number | null;
    month: number | null;
    categories: string[];
    limit: number;
  };
}

const CATEGORIES = [
  "Footwear",
  "Fan",
  "BioShield",
  "Instrument",
  "Appliance Parts",
  "Reagent",
];

export default function SalesHistoryPage() {
  const [salesHistory, setSalesHistory] = useState<SalesHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: "",
    categories: [] as string[],
    limit: 500,
  });
  const [showDetails, setShowDetails] = useState(false);

  const months = [
    { value: "", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = [2023, 2024, 2025, 2026];

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append("year", filters.year.toString());
      if (filters.month) params.append("month", filters.month);
      if (filters.categories.length > 0)
        params.append("categories", filters.categories.join(","));
      params.append("limit", filters.limit.toString());

      const response = await fetch(`/api/sales/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSalesHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch sales history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      month: "",
      categories: [],
      limit: 500,
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading sales history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sales History & Category Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Category-wise sales breakdown for VAT 9.1 return filing
          </p>
        </div>
        <Link
          href="/sales"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Back to Sales
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                handleFilterChange("year", parseInt(e.target.value))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Records Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) =>
                handleFilterChange("limit", parseInt(e.target.value))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={100}>100 records</option>
              <option value={200}>200 records</option>
              <option value={500}>500 records</option>
              <option value={1000}>1000 records</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchSalesHistory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category (Multiple Selection)
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.categories.includes(category)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {filters.categories.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {filters.categories.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Warning if no category breakdown */}
      {salesHistory &&
        salesHistory.categoryBreakdown.length === 0 &&
        salesHistory.sales.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-2xl">⚠️</div>
              <div>
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  Category Breakdown Not Available
                </h3>
                <p className="text-sm text-yellow-800 mb-2">
                  The selected sales do not have product line items
                  (sales_lines) associated with them. Category-wise breakdown
                  requires sales to have detailed product information.
                </p>
                <p className="text-sm text-yellow-800">
                  <strong>Total for selected period:</strong> Net Sales: ৳
                  {Number(salesHistory.summary.totalRevenue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Category Breakdown - Main Feature */}
      {salesHistory && salesHistory.categoryBreakdown.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6 border-2 border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Category-wise Sales Summary
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                For VAT 9.1 Return Filing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {salesHistory.categoryBreakdown.map((cat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {cat.category || "Uncategorized"}
                    </h3>
                    {cat.hsCode && (
                      <p className="text-xs text-gray-500 mt-1">
                        HS Code: {cat.hsCode}
                      </p>
                    )}
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                    {cat.saleCount} sales
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Net Sales (Ex-VAT):
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ৳{Number(cat.netSales).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      VAT Amount (15%):
                    </span>
                    <span className="text-sm font-semibold text-orange-600">
                      ৳{Number(cat.vatAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      Gross Sales:
                    </span>
                    <span className="text-base font-bold text-green-600">
                      ৳{Number(cat.grossSales).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Total Quantity:</span>
                    <span>{Number(cat.totalQuantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total */}
          <div className="mt-6 bg-white rounded-lg p-5 border-2 border-blue-300">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Grand Total
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Net Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ৳
                  {salesHistory.categoryBreakdown
                    .reduce((sum, cat) => sum + Number(cat.netSales), 0)
                    .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total VAT</p>
                <p className="text-2xl font-bold text-orange-600">
                  ৳
                  {salesHistory.categoryBreakdown
                    .reduce((sum, cat) => sum + Number(cat.vatAmount), 0)
                    .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Gross Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  ৳
                  {salesHistory.categoryBreakdown
                    .reduce((sum, cat) => sum + Number(cat.grossSales), 0)
                    .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {salesHistory && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Total Sales Count
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {salesHistory.summary.totalSales.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ৳{salesHistory.summary.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Average Sale Value
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ৳{salesHistory.summary.avgSaleValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Sales Details Toggle */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Detailed Sales Records</h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {showDetails && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Items
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Net
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    VAT
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesHistory && salesHistory.sales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No sales records found for the selected period.
                    </td>
                  </tr>
                ) : (
                  salesHistory?.sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(sale.dt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sale.invoiceNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                        {sale.customerDisplay}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {sale.itemCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {sale.totalQuantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        ৳{Number(sale.netOfVat).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        ৳{Number(sale.vatAmount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        ৳{Number(sale.grandTotal).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/sales/${sale.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
