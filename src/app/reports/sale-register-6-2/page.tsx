"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, Calendar } from "lucide-react";
import { generateMushok62PDF } from "@/lib/pdf-generator";
import AuthGuard from "@/components/AuthGuard";

interface SaleRecord {
  invoice_no: string;
  sale_date: string;
  customer: string;
  customer_bin: string;
  customer_address: string;
  total_value: number;
  vat_amount: number;
  taxable_value: number;
  amount_type: string;
  notes?: string;
}

export default function SaleRegister62Page() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
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

        // Load sales data
        const response = await fetch(
          `/api/reports/sale-register-6-2?month=${displayMonth}&year=${displayYear}`
        );
        const result = await response.json();
        setSales(result.sales || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [displayMonth, displayYear]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const response = await fetch(
        `/api/reports/sale-register-6-2?month=${displayMonth}&year=${displayYear}`
      );
      const result = await response.json();

      const pdfData = {
        sales: result.sales || [],
        period: {
          month: displayMonth,
          year: displayYear,
        },
        settings: settings,
      };

      const pdf = generateMushok62PDF(pdfData);
      pdf.save(`Mushok_6.2_${displayYear}_${displayMonth}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AuthGuard>
    );
  }

  const totals = sales.reduce(
    (acc, item) => {
      const taxableValue = Number(item.taxable_value || 0);
      const vatAmount = Number(item.vat_amount || 0);
      return {
        taxableValue: acc.taxableValue + taxableValue,
        vat: acc.vat + vatAmount,
        totalValue: acc.totalValue + taxableValue + vatAmount,
      };
    },
    { taxableValue: 0, vat: 0, totalValue: 0 }
  );

  const valueExVat = totals.taxableValue;

  // Generate year options (last 5 years)
  const yearOptions = [];
  for (let i = 0; i < 5; i++) {
    yearOptions.push((currentDate.getFullYear() - i).toString());
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-full mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              মূসক ৬.২ - বিক্রয় রেজিস্টার
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Sales Register - {monthName}
            </p>
          </div>

          {/* Month/Year Selector and Download Button */}
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

                <Button
                  onClick={handleDownloadPDF}
                  disabled={downloading || loading || sales.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Mushok 6.2 PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                সকল বিক্রয় চালান (All Sales Invoices)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ক্রমিক
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        চালান নং
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        তারিখ
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ক্রেতার নাম
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ঠিকানা
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        BIN/NID
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                        করযোগ্য মূল্য
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                        মূসক (১৫%)
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                        মোট মূল্য
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium text-gray-500">
                            এই মাসে কোন বিক্রয় নেই
                          </p>
                        </td>
                      </tr>
                    ) : (
                      sales.map((item, index) => {
                        const taxableValue = Number(item.taxable_value);
                        const vatAmount = Number(item.vat_amount);
                        // Total = Taxable Value + VAT (correct calculation)
                        const totalValue = taxableValue + vatAmount;

                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-gray-900 font-medium">
                              {item.invoice_no}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {new Date(item.sale_date).toLocaleDateString(
                                "en-GB"
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-900">
                              {item.customer}
                            </td>
                            <td className="px-3 py-2 text-gray-600 text-xs">
                              {item.customer_address || "-"}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.customer_bin || "-"}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-900">
                              ৳
                              {taxableValue.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 text-right text-green-600 font-medium">
                              ৳
                              {vatAmount.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-900 font-medium">
                              ৳
                              {totalValue.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    {sales.length > 0 && (
                      <tr className="bg-blue-50 font-bold">
                        <td
                          colSpan={6}
                          className="px-3 py-3 text-right text-gray-900"
                        >
                          মোট:
                        </td>
                        <td className="px-3 py-3 text-right text-gray-900">
                          ৳
                          {totals.taxableValue.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-3 text-right text-green-700">
                          ৳
                          {totals.vat.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-900">
                          ৳
                          {totals.totalValue.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
