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

  const [selectedYear, setSelectedYear] = useState(2022);
  const [selectedMonth, setSelectedMonth] = useState(11);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vatRes, balanceRes, challanRes] = await Promise.all([
        fetch("/api/vat/ledger"),
        fetch("/api/vat/closing-balance"),
        fetch("/api/treasury/challans"),
      ]);

      if (vatRes.ok) {
        const vatData = await vatRes.json();
        setVatEntries(vatData);
      }

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setClosingBalances(balanceData);
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
                    {[2022, 2023, 2024, 2025].map((year) => (
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
                        <>
                          <Unlock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-bold text-orange-900">
                            Open
                          </span>
                        </>
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
