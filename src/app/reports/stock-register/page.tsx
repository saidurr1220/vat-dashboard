"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface StockItem {
  month: string;
  item: {
    id: number;
    sku: string;
    name: string;
    category: string;
    unit: string;
  };
  opening_qty: number;
  purchase_qty: number;
  sales_qty: number;
  adjust_qty: number;
  closing_qty: number;
  avg_unit_cost: number;
  out_invoices: Array<{
    date: string;
    invoice_no: string;
    customer: string;
    qty_out: number;
    price_excl: number;
    vat_15: number;
    total_incl: number;
  }>;
  validation: {
    warnings: string[];
    errors: string[];
  };
}

interface StockRegisterData {
  success: boolean;
  data: StockItem[];
  summary: {
    total_items: number;
    months: string[];
  };
}

export default function StockRegisterPage() {
  const [data, setData] = useState<StockRegisterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchStockRegister();
  }, []);

  const fetchStockRegister = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/reports/stock-register?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch stock register:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (itemKey: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  const exportStockRegisterCSV = () => {
    if (!data?.data) return;

    const csvRows = [
      "Month,Item SKU,Item Name,Category,Unit,Opening Qty,Purchase Qty,Sales Qty,Adjust Qty,Closing Qty,Avg Unit Cost",
    ];

    data.data.forEach((item) => {
      csvRows.push(
        `${item.month},${item.item.sku},"${item.item.name}",${
          item.item.category
        },${item.item.unit},${item.opening_qty},${item.purchase_qty},${
          item.sales_qty
        },${item.adjust_qty},${item.closing_qty},${item.avg_unit_cost.toFixed(
          2
        )}`
      );
    });

    downloadCSV(
      csvRows.join("\n"),
      `Stock_Register_${selectedMonth || "All"}.csv`
    );
  };

  const exportInvoicesCSV = () => {
    if (!data?.data) return;

    const csvRows = [
      "Month,Item SKU,Item Name,Invoice No,Date,Customer,Qty Out,Price Excl,VAT 15%,Total Incl",
    ];

    data.data.forEach((item) => {
      item.out_invoices.forEach((invoice) => {
        csvRows.push(
          `${item.month},${item.item.sku},"${item.item.name}",${
            invoice.invoice_no
          },${invoice.date},"${invoice.customer}",${
            invoice.qty_out
          },${invoice.price_excl.toFixed(2)},${invoice.vat_15.toFixed(
            2
          )},${invoice.total_incl.toFixed(2)}`
        );
      });
    });

    downloadCSV(
      csvRows.join("\n"),
      `Stock_Invoices_${selectedMonth || "All"}.csv`
    );
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSummaryStats = () => {
    if (!data?.data) return null;

    const totalOpening = data.data.reduce(
      (sum, item) => sum + item.opening_qty,
      0
    );
    const totalPurchases = data.data.reduce(
      (sum, item) => sum + item.purchase_qty,
      0
    );
    const totalSales = data.data.reduce((sum, item) => sum + item.sales_qty, 0);
    const totalAdjustments = data.data.reduce(
      (sum, item) => sum + item.adjust_qty,
      0
    );
    const totalClosing = data.data.reduce(
      (sum, item) => sum + item.closing_qty,
      0
    );

    return {
      totalOpening,
      totalPurchases,
      totalSales,
      totalAdjustments,
      totalClosing,
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monthly Stock Register
          </h1>
          <p className="text-gray-600">
            Opening Stock + Purchases (6.1) − Sales (6.2) ± Adjustments =
            Closing Stock
          </p>
        </div>

        {/* Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Opening Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalOpening.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Purchases (6.1)</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{stats.totalPurchases.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sales (6.2)</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{stats.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Adjustments</p>
                  <p
                    className={`text-2xl font-bold ${
                      stats.totalAdjustments >= 0
                        ? "text-blue-600"
                        : "text-orange-600"
                    }`}
                  >
                    {stats.totalAdjustments >= 0 ? "+" : ""}
                    {stats.totalAdjustments.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Closing Stock</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalClosing.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Filters & Export
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={currentMonth}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) =>
                  setSelectedCategory(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="footwear">Footwear</SelectItem>
                  <SelectItem value="reagent">Reagent</SelectItem>
                  <SelectItem value="instrument">Instrument</SelectItem>
                  <SelectItem value="fan">Fan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchStockRegister}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                onClick={exportStockRegisterCSV}
                variant="outline"
                className="w-full gap-2"
                disabled={!data?.data}
              >
                <Download className="w-4 h-4" />
                Stock CSV
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                onClick={exportInvoicesCSV}
                variant="outline"
                className="w-full gap-2"
                disabled={!data?.data}
              >
                <FileText className="w-4 h-4" />
                Invoices CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Stock Register Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Stock Movement Register
            </h2>
            {data?.summary && (
              <p className="text-sm text-gray-600 mt-1">
                {data.summary.total_items} items • Months:{" "}
                {data.summary.months.join(", ")}
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium">
                Loading stock register...
              </p>
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Item Details
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Opening
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Purchases
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Adjust
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Closing
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Invoices
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.map((item) => {
                    const itemKey = `${item.month}-${item.item.id}`;
                    const isExpanded = expandedItems.has(itemKey);
                    const hasInvoices = item.out_invoices.length > 0;

                    return (
                      <React.Fragment key={itemKey}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {item.item.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  SKU: {item.item.sku} • {item.item.category} •{" "}
                                  {item.item.unit}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-medium text-gray-900">
                            {item.month}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-gray-900 font-medium">
                            {item.opening_qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-green-600 font-semibold">
                            +{item.purchase_qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-red-600 font-semibold">
                            -{item.sales_qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-gray-900 font-medium">
                            {item.adjust_qty >= 0 ? "+" : ""}
                            {item.adjust_qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-purple-600">
                            {item.closing_qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {hasInvoices ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(itemKey)}
                                className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                {item.out_invoices.length} invoice
                                {item.out_invoices.length !== 1 ? "s" : ""}
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No invoices
                              </span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && hasInvoices && (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-4 bg-blue-50 border-t border-blue-100"
                            >
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  Sales Invoices for {item.item.name} (
                                  {item.month})
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                                    <thead className="bg-white">
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                          Date
                                        </th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                          Invoice No
                                        </th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                          Customer
                                        </th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700">
                                          Qty Out
                                        </th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700">
                                          Price (Excl)
                                        </th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700">
                                          VAT 15%
                                        </th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700">
                                          Total (Incl)
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                      {item.out_invoices.map((invoice, idx) => (
                                        <tr
                                          key={idx}
                                          className="border-b border-gray-100 hover:bg-gray-50"
                                        >
                                          <td className="py-2 px-3 text-gray-700">
                                            {invoice.date}
                                          </td>
                                          <td className="py-2 px-3 text-gray-900 font-medium">
                                            {invoice.invoice_no}
                                          </td>
                                          <td className="py-2 px-3 text-gray-700">
                                            {invoice.customer}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-900 font-medium">
                                            {invoice.qty_out}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-700">
                                            ৳
                                            {invoice.price_excl.toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              }
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-700">
                                            ৳
                                            {invoice.vat_15.toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              }
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-900 font-semibold">
                                            ৳
                                            {invoice.total_incl.toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              }
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                      <tr>
                                        <td
                                          colSpan={3}
                                          className="py-2 px-3 text-right font-bold text-gray-900"
                                        >
                                          Total:
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                                          {item.out_invoices.reduce(
                                            (sum, inv) => sum + inv.qty_out,
                                            0
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                                          ৳
                                          {item.out_invoices
                                            .reduce(
                                              (sum, inv) =>
                                                sum + inv.price_excl,
                                              0
                                            )
                                            .toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                                          ৳
                                          {item.out_invoices
                                            .reduce(
                                              (sum, inv) => sum + inv.vat_15,
                                              0
                                            )
                                            .toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                                          ৳
                                          {item.out_invoices
                                            .reduce(
                                              (sum, inv) =>
                                                sum + inv.total_incl,
                                              0
                                            )
                                            .toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium text-lg">
                No stock data found
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your filters or check if you have sales/purchase
                data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
