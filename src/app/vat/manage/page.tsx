"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calculator,
  Calendar,
  Banknote,
  TrendingUp,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building2,
  CreditCard,
  DollarSign,
  BarChart3,
  Settings,
  Lock,
  Unlock,
} from "lucide-react";

interface VATLedgerEntry {
  id: number;
  periodYear: number;
  periodMonth: number;
  grossSales: string;
  netSalesExVat: string;
  vatRate: string;
  vatPayable: string;
  usedFromClosingBalance: string;
  treasuryNeeded: string;
  locked: boolean;
}

interface ClosingBalance {
  id: number;
  periodYear: number;
  periodMonth: number;
  amountBdt: string;
}

interface TreasuryChallan {
  id: number;
  voucherNo?: string;
  tokenNo: string;
  bank: string;
  branch: string;
  date: string;
  accountCode: string;
  amountBdt: string;
  periodYear: number;
  periodMonth: number;
}

export default function VATManagePage() {
  const [vatEntries, setVatEntries] = useState<VATLedgerEntry[]>([]);
  const [closingBalances, setClosingBalances] = useState<ClosingBalance[]>([]);
  const [treasuryChallans, setTreasuryChallans] = useState<TreasuryChallan[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Refetch data when year changes to get updated information
    if (availableYears.length > 0) {
      fetchData();
    }
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      const [vatRes, balanceRes, challanRes, salesRes] = await Promise.all([
        fetch("/api/vat/ledger"),
        fetch("/api/vat/closing-balance"),
        fetch("/api/treasury/challans"),
        fetch("/api/sales"),
      ]);

      if (vatRes.ok) {
        const vatData = await vatRes.json();
        setVatEntries(vatData);
      }

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setClosingBalances(balanceData);
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        // Extract unique years from sales data
        const yearSet = new Set<number>();
        salesData.forEach((sale: any) => {
          yearSet.add(new Date(sale.dt).getFullYear());
        });
        const years = Array.from(yearSet).sort((a, b) => b - a);
        setAvailableYears(years);
      }

      if (challanRes.ok) {
        const challanData = await challanRes.json();
        setTreasuryChallans(challanData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async (year: number, month: number) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/vat/ledger`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodYear: year,
          periodMonth: month,
          locked: true,
        }),
      });

      if (response.ok) {
        // Show success message (you can add toast notification here)
        alert(`VAT period ${month}/${year} marked as complete!`);
        // Refresh data
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to mark as complete: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error marking as complete:", error);
      alert("Failed to mark as complete. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPeriodData = () => {
    const vatEntry = vatEntries.find(
      (entry) =>
        entry.periodYear === selectedYear && entry.periodMonth === selectedMonth
    );
    const closingBalance = closingBalances.find(
      (balance) =>
        balance.periodYear === selectedYear &&
        balance.periodMonth === selectedMonth
    );
    const challans = treasuryChallans.filter(
      (challan) =>
        challan.periodYear === selectedYear &&
        challan.periodMonth === selectedMonth
    );

    return { vatEntry, closingBalance, challans };
  };

  const { vatEntry, closingBalance, challans } = getCurrentPeriodData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading VAT Management
                </h3>
                <p className="text-gray-600">
                  Please wait while we fetch VAT data...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  VAT Management
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Compute VAT using closing balance and treasury challans
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <Calendar className="mr-2 h-4 w-4" />
                VAT Management
              </Badge>
              <Link href="/vat">
                <Button variant="outline" className="gap-2">
                  ← Back to VAT
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Period Selection */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">
                Select Period for VAT Management
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="border-2 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.length > 0
                      ? availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))
                      : [2022, 2023, 2024, 2025].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Month</Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="border-2 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: 1, label: "January" },
                      { value: 2, label: "February" },
                      { value: 3, label: "March" },
                      { value: 4, label: "April" },
                      { value: 5, label: "May" },
                      { value: 6, label: "June" },
                      { value: 7, label: "July" },
                      { value: 8, label: "August" },
                      { value: 9, label: "September" },
                      { value: 10, label: "October" },
                      { value: 11, label: "November" },
                      { value: 12, label: "December" },
                    ].map((month) => (
                      <SelectItem
                        key={month.value}
                        value={month.value.toString()}
                      >
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Year-wise Summary */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">
                {selectedYear} Year Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-700">
                      Total VAT Entries
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {
                        vatEntries.filter(
                          (entry) => entry.periodYear === selectedYear
                        ).length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700">
                      Total VAT Payable
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ৳
                      {vatEntries
                        .filter((entry) => entry.periodYear === selectedYear)
                        .reduce(
                          (sum, entry) => sum + Number(entry.vatPayable),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-orange-700">
                      Treasury Paid
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      ৳
                      {treasuryChallans
                        .filter(
                          (challan) => challan.periodYear === selectedYear
                        )
                        .reduce(
                          (sum, challan) => sum + Number(challan.amountBdt),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-purple-700">
                      Closing Balance Used
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      ৳
                      {vatEntries
                        .filter((entry) => entry.periodYear === selectedYear)
                        .reduce(
                          (sum, entry) =>
                            sum + Number(entry.usedFromClosingBalance),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* VAT Summary */}
        {vatEntry ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Gross Sales
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      ৳{Number(vatEntry.grossSales).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">
                      VAT Payable
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      ৳{Number(vatEntry.vatPayable).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {vatEntry.locked ? (
                        <>
                          <Lock className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold text-green-900">
                            Locked
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Unlock className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-bold text-orange-900">
                              Open
                            </span>
                          </div>
                          <Button
                            onClick={() =>
                              markAsComplete(selectedYear, selectedMonth)
                            }
                            disabled={saving}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Completing...
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No VAT Data Found
              </h3>
              <p className="text-gray-600 mb-6">
                No VAT computation found for {selectedMonth}/{selectedYear}.
                Please compute VAT first using Monthly VAT page.
              </p>
              <Link href="/vat/monthly">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2">
                  <Calculator className="w-4 h-4" />
                  Go to Monthly VAT
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Closing Balance */}
        {closingBalance && (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl">Closing Balance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">
                      Available Closing Balance
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      ৳{Number(closingBalance.amountBdt).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Treasury Challans */}
        {challans.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl">Treasury Challans</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challans.map((challan) => (
                  <div
                    key={challan.id}
                    className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-emerald-900">
                          Token: {challan.tokenNo}
                        </p>
                        <p className="text-sm text-emerald-700">
                          {challan.bank} - {challan.branch}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {new Date(challan.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-900">
                          ৳{Number(challan.amountBdt).toLocaleString()}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-emerald-700 border-emerald-300"
                        >
                          {challan.accountCode}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/vat/monthly">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2">
                  <Calculator className="w-4 h-4" />
                  Monthly VAT Computation
                </Button>
              </Link>
              <Link href="/vat/closing-balance">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2">
                  <Banknote className="w-4 h-4" />
                  Manage Closing Balance
                </Button>
              </Link>
              <Link href="/treasury">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 gap-2">
                  <CreditCard className="w-4 h-4" />
                  Treasury Challans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
