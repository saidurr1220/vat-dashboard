"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Sale {
  id: number;
  invoiceNo: string;
  date: string;
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

interface SalesHistory {
  sales: Sale[];
  summary: {
    totalSales: number;
    totalRevenue: number;
    avgSaleValue: number;
  };
  filters: {
    year: number | null;
    month: number | null;
    limit: number;
  };
}

export default function SalesHistoryPage() {
  const [salesHistory, setSalesHistory] = useState<SalesHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: "",
    limit: 100,
  });

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
  }, [filters]);

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append("year", filters.year.toString());
      if (filters.month) params.append("month", filters.month);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading sales history...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-600">
            View historical sales data and analytics
          </p>
        </div>
        <Link
          href="/sales"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Back to Sales
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                handleFilterChange("year", parseInt(e.target.value))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) =>
                handleFilterChange("limit", parseInt(e.target.value))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
              <option value={200}>200 records</option>
              <option value={500}>500 records</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchSalesHistory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {salesHistory && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="text-2xl font-bold text-gray-900">
              {salesHistory.summary.totalSales.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">
              ৳{salesHistory.summary.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Average Sale Value
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              ৳{salesHistory.summary.avgSaleValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Sales Records</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VAT (15%)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grand Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesHistory && salesHistory.sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No sales records found for the selected period.
                  </td>
                </tr>
              ) : (
                salesHistory?.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.invoiceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customerDisplay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {sale.itemCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {sale.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.amountType === "INCL"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {sale.amountType === "INCL" ? "VAT Incl." : "VAT Excl."}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ৳{Number(sale.netOfVat).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ৳{Number(sale.vatAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ৳{Number(sale.grandTotal).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="text-blue-600 hover:text-blue-900"
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
      </div>
    </div>
  );
}
