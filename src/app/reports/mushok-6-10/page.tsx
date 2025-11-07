"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  FileText,
  Download,
  Calendar,
  ShoppingCart,
  Package,
} from "lucide-react";
import { generateMushok610PDF } from "@/lib/pdf-generator";
import AuthGuard from "@/components/AuthGuard";

interface Transaction {
  invoice_no: string;
  transaction_date: string;
  value: number;
  supplier_name?: string;
  supplier_address?: string;
  supplier_bin?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_bin?: string;
}

export default function Mushok610Page() {
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    (currentDate.getMonth() + 1).toString().padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString()
  );

  const displayMonth = selectedMonth;
  const displayYear = selectedYear;
  const monthName = new Date(
    parseInt(displayYear),
    parseInt(displayMonth) - 1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load settings
        const settingsResponse = await fetch("/api/settings");
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);

        // Load Mushok 6.10 data
        const response = await fetch(
          `/api/reports/mushok-6-10?month=${displayMonth}&year=${displayYear}`
        );
        const result = await response.json();
        setPurchases(result.purchases || []);
        setSales(result.sales || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [displayMonth, displayYear]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const response = await fetch(
        `/api/reports/mushok-6-10?month=${displayMonth}&year=${displayYear}`
      );
      const result = await response.json();

      const pdfData = {
        purchases: result.purchases || [],
        sales: result.sales || [],
        period: {
          month: displayMonth,
          year: displayYear,
        },
        settings: settings,
      };

      const pdf = generateMushok610PDF(pdfData);
      pdf.save(`Mushok_6.10_${displayYear}_${displayMonth}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Generate year options (last 5 years)
  const yearOptions = [];
  for (let i = 0; i < 5; i++) {
    yearOptions.push((currentDate.getFullYear() - i).toString());
  }

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AuthGuard>
    );
  }

  const purchaseTotal = purchases.reduce(
    (sum, item) => sum + Number(item.value),
    0
  );
  const salesTotal = sales.reduce((sum, item) => sum + Number(item.value), 0);

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-full mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">মূসক ৬.১০</h1>
            <p className="text-lg text-gray-600 mt-2">
              ২(দুই) লক্ষ টাকার অধিক মূল্যমানের ক্রয়-বিক্রয় চালানপত্রের তথ্য
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {monthName} - Transactions above ৳2,00,000
            </p>
          </div>

          {/* Month/Year Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">
                      Month:
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Year:
                    </label>
                    <select
                      value={selectedYear}
                      onChange={handleYearChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-gray-600">Purchases</p>
                    <p className="text-lg font-bold text-blue-600">
                      {purchases.length}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-green-50 rounded-md">
                    <p className="text-xs text-gray-600">Sales</p>
                    <p className="text-lg font-bold text-green-600">
                      {sales.length}
                    </p>
                  </div>
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={
                      downloading ||
                      loading ||
                      (purchases.length === 0 && sales.length === 0)
                    }
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                অংশ - ক: ক্রয় হিসাব তথ্য (Purchases above ৳2,00,000)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ক্রমিক সংখ্যা
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        চালানপত্র নং
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ইস্যুর তারিখ
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                        মূল্য
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        বিক্রেতার নাম
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        বিক্রেতার ঠিকানা
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        বিক্রেতার BIN/NID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium text-gray-500">
                            এই মাসে ২ লক্ষ টাকার উপরের কোন ক্রয় নেই
                          </p>
                        </td>
                      </tr>
                    ) : (
                      purchases.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 text-gray-900 font-medium">
                            {item.invoice_no}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {new Date(item.transaction_date).toLocaleDateString(
                              "en-GB"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900 font-medium">
                            ৳
                            {Number(item.value).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {item.supplier_name || "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-600 text-xs">
                            {item.supplier_address || "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {item.supplier_bin || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                    {purchases.length > 0 && (
                      <tr className="bg-blue-50 font-bold">
                        <td
                          colSpan={3}
                          className="px-3 py-3 text-right text-gray-900"
                        >
                          সর্বমোট:
                        </td>
                        <td className="px-3 py-3 text-right text-gray-900">
                          ৳
                          {purchaseTotal.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Sales Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                অংশ - খ: বিক্রয় হিসাব তথ্য (Sales above ৳2,00,000)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ক্রমিক সংখ্যা
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        চালানপত্র নং
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ইস্যুর তারিখ
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                        মূল্য
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ক্রেতার নাম
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ক্রেতার ঠিকানা
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ক্রেতার BIN/NID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium text-gray-500">
                            এই মাসে ২ লক্ষ টাকার উপরের কোন বিক্রয় নেই
                          </p>
                        </td>
                      </tr>
                    ) : (
                      sales.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 text-gray-900 font-medium">
                            {item.invoice_no}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {new Date(item.transaction_date).toLocaleDateString(
                              "en-GB"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900 font-medium">
                            ৳
                            {Number(item.value).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {item.buyer_name || "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-600 text-xs">
                            {item.buyer_address || "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {item.buyer_bin || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                    {sales.length > 0 && (
                      <tr className="bg-green-50 font-bold">
                        <td
                          colSpan={3}
                          className="px-3 py-3 text-right text-gray-900"
                        >
                          সর্বমোট:
                        </td>
                        <td className="px-3 py-3 text-right text-gray-900">
                          ৳
                          {salesTotal.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ৳{purchaseTotal.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {purchases.length} transactions
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    ৳{salesTotal.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {sales.length} transactions
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Net Position</p>
                  <p
                    className={`text-2xl font-bold ${
                      salesTotal > purchaseTotal
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    ৳
                    {Math.abs(salesTotal - purchaseTotal).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {salesTotal > purchaseTotal
                      ? "Sales surplus"
                      : "Purchase surplus"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
