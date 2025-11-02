"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Receipt,
  Banknote,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  FileDown,
  Calculator,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportData {
  period: {
    year: number;
    month?: number;
    monthName?: string;
  };
  sales: {
    totalSales: number;
    grossAmount: number;
    netAmount: number;
    vatAmount: number;
    salesCount: number;
    avgSaleValue: number;
  };
  treasury: {
    totalPaid: number;
    challanCount: number;
    avgChallanAmount: number;
    challans: Array<{
      tokenNo: string;
      amount: number;
      date: string;
      bank: string;
    }>;
  };
  vat: {
    payable: number;
    paid: number;
    outstanding: number;
    rate: number;
  };
  summary: {
    compliance: number; // percentage
    status: "compliant" | "pending" | "overdue";
  };
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ComprehensiveVATReports() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filters, setFilters] = useState({
    reportType: "monthly", // monthly, yearly, custom
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: "",
    endDate: "",
  });

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: filters.reportType,
        year: filters.year.toString(),
        ...(filters.reportType === "monthly" && {
          month: filters.month.toString(),
        }),
        ...(filters.reportType === "custom" && {
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      });

      const response = await fetch(`/api/vat/comprehensive-report?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        showError("Error", "Failed to fetch report data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      showError("Error", "Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [filters.reportType, filters.year, filters.month]);

  const downloadPDF = async (period?: { year: number; month?: number }) => {
    try {
      const params = new URLSearchParams({
        type: filters.reportType,
        year: filters.year.toString(),
        format: "pdf",
        ...(period?.month && { month: period.month.toString() }),
        ...(filters.reportType === "custom" && {
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      });

      const response = await fetch(`/api/vat/comprehensive-report?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `VAT-Report-${filters.year}${
          period?.month ? `-${String(period.month).padStart(2, "0")}` : ""
        }.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess("Success", "Report downloaded successfully");
      } else {
        showError("Error", "Failed to download report");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      showError("Error", "Failed to download report");
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Comprehensive VAT Reports
          </h1>
          <p className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4" />
            Complete audit trail and tax compliance reports
          </p>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select
                  value={filters.reportType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, reportType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="yearly">Yearly Summary</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year</Label>
                <Select
                  value={filters.year.toString()}
                  onValueChange={(value) =>
                    setFilters({ ...filters, year: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2022, 2023, 2024, 2025].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filters.reportType === "monthly" && (
                <div>
                  <Label>Month</Label>
                  <Select
                    value={filters.month.toString()}
                    onValueChange={(value) =>
                      setFilters({ ...filters, month: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, index) => (
                        <SelectItem
                          key={index + 1}
                          value={(index + 1).toString()}
                        >
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filters.reportType === "custom" && (
                <>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div className="flex items-end gap-2">
                <Button
                  onClick={fetchReportData}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
                <Button
                  onClick={() => downloadPDF()}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading comprehensive report...</p>
            </div>
          </div>
        )}

        {/* Report Data */}
        {!loading && reportData.length > 0 && (
          <div className="space-y-8">
            {reportData.map((data, index) => (
              <Card
                key={index}
                className="border-0 shadow-xl bg-white/90 backdrop-blur-sm"
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {data.period.monthName
                        ? `${data.period.monthName} ${data.period.year}`
                        : `Year ${data.period.year}`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${getComplianceColor(
                          data.summary.status
                        )} flex items-center gap-1`}
                      >
                        {getStatusIcon(data.summary.status)}
                        {data.summary.status.charAt(0).toUpperCase() +
                          data.summary.status.slice(1)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPDF(data.period)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      >
                        <FileDown className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">
                            Total Sales
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            ৳{data.sales.grossAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-600">
                            {data.sales.salesCount} transactions
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">
                            VAT Payable
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            ৳{data.vat.payable.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600">
                            {data.vat.rate * 100}% rate
                          </p>
                        </div>
                        <Calculator className="w-8 h-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">
                            Treasury Paid
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            ৳{data.treasury.totalPaid.toLocaleString()}
                          </p>
                          <p className="text-xs text-purple-600">
                            {data.treasury.challanCount} challans
                          </p>
                        </div>
                        <Banknote className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm font-medium">
                            Outstanding
                          </p>
                          <p className="text-2xl font-bold text-orange-900">
                            ৳{data.vat.outstanding.toLocaleString()}
                          </p>
                          <p className="text-xs text-orange-600">
                            {(
                              (data.vat.outstanding / data.vat.payable) *
                              100
                            ).toFixed(1)}
                            % pending
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Breakdown */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Sales Breakdown
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gross Sales:</span>
                          <span className="font-medium">
                            ৳{data.sales.grossAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Net Sales (Ex-VAT):
                          </span>
                          <span className="font-medium">
                            ৳{data.sales.netAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VAT Amount:</span>
                          <span className="font-medium">
                            ৳{data.sales.vatAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Average Sale Value:
                          </span>
                          <span className="font-medium">
                            ৳{data.sales.avgSaleValue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Total Transactions:
                          </span>
                          <span className="font-medium">
                            {data.sales.salesCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Treasury Details */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Treasury Payments
                      </h3>
                      {data.treasury.challans.length > 0 ? (
                        <div className="space-y-2">
                          {data.treasury.challans.map((challan, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm bg-white p-2 rounded"
                            >
                              <div>
                                <span className="font-medium">
                                  {challan.tokenNo}
                                </span>
                                <div className="text-xs text-gray-500">
                                  {challan.bank}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  ৳{challan.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(challan.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No treasury payments recorded
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Compliance Status */}
                  <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Compliance Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">VAT Payable:</span>
                        <span className="ml-2 font-medium">
                          ৳{data.vat.payable.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="ml-2 font-medium">
                          ৳{data.vat.paid.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Compliance Rate:</span>
                        <span className="ml-2 font-medium">
                          {data.summary.compliance.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Data State */}
        {!loading && reportData.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Report Data
              </h3>
              <p className="text-gray-600 mb-4">
                No data available for the selected period. Try adjusting your
                filters.
              </p>
              <Button onClick={fetchReportData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
