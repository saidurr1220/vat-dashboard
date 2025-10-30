"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

interface MonthlySales {
  year: number;
  month: number;
  totalGross: number;
  totalVAT: number;
  totalNet: number;
  invoiceCount: number;
}

interface ClosingBalance {
  year: number;
  month: number;
  openingBalance: number;
  currentMonthAddition: number;
  usedAmount: number;
  closingBalance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VATComputation {
  year: number;
  month: number;
  grossSales: number;
  netSalesExVat: number;
  vatPayable: number;
  usedFromClosingBalance: number;
  treasuryNeeded: number;
  locked: boolean;
}

export default function MonthlyVATPage() {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2022);
  const [selectedMonth, setSelectedMonth] = useState(11);

  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [closingBalances, setClosingBalances] = useState<ClosingBalance[]>([]);
  const [vatComputations, setVATComputations] = useState<VATComputation[]>([]);

  // Form state for VAT computation
  const [usedFromClosing, setUsedFromClosing] = useState("");
  const [treasuryAmount, setTreasuryAmount] = useState("");

  // Auto-calculate closing balance usage when treasury amount changes
  useEffect(() => {
    const salesData = getCurrentMonthSales();
    if (salesData && treasuryAmount) {
      const treasuryAmountNum = parseFloat(treasuryAmount) || 0;
      const remainingVAT = Math.max(0, salesData.totalVAT - treasuryAmountNum);
      setUsedFromClosing(remainingVAT.toString());
    }
  }, [treasuryAmount, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch monthly sales data
      const salesResponse = await fetch("/api/vat/monthly-sales");
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setMonthlySales(salesData);
      }

      // Fetch closing balances
      const balanceResponse = await fetch("/api/vat/closing-balance");
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setClosingBalances(balanceData);
      }

      // Fetch VAT computations
      const vatResponse = await fetch("/api/vat/computations");
      if (vatResponse.ok) {
        const vatData = await vatResponse.json();
        setVATComputations(vatData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
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
    return months[month - 1];
  };

  const getCurrentMonthSales = () => {
    return monthlySales.find(
      (s) => s.year === selectedYear && s.month === selectedMonth
    );
  };

  const getCurrentClosingBalance = () => {
    return closingBalances.find(
      (b) => b.year === selectedYear && b.month === selectedMonth
    );
  };

  const getCurrentVATComputation = () => {
    return vatComputations.find(
      (v) => v.year === selectedYear && v.month === selectedMonth
    );
  };

  const computeVAT = async () => {
    const salesData = getCurrentMonthSales();
    if (!salesData) {
      alert("No sales data found for selected month");
      return;
    }

    if (!treasuryAmount) {
      alert("Please enter treasury challan amount");
      return;
    }

    const usedAmount = parseFloat(usedFromClosing);
    const treasuryAmountNum = parseFloat(treasuryAmount);

    if (usedAmount + treasuryAmountNum < salesData.totalVAT) {
      const shortfall = salesData.totalVAT - (usedAmount + treasuryAmountNum);
      if (
        !confirm(
          `VAT shortfall of ৳${shortfall.toLocaleString()}. Continue anyway?`
        )
      ) {
        return;
      }
    }

    setComputing(true);

    try {
      const computationData = {
        year: selectedYear,
        month: selectedMonth,
        grossSales: salesData.totalGross,
        netSalesExVat: salesData.totalNet,
        vatPayable: salesData.totalVAT,
        usedFromClosingBalance: usedAmount,
        treasuryNeeded: treasuryAmountNum,
      };

      const response = await fetch("/api/vat/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(computationData),
      });

      if (response.ok) {
        alert("VAT computation saved successfully!");
        await fetchData();

        // Reset form
        setUsedFromClosing("");
        setTreasuryAmount("");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to compute VAT"}`);
      }
    } catch (error) {
      console.error("Error computing VAT:", error);
      alert("Failed to compute VAT");
    } finally {
      setComputing(false);
    }
  };

  const addTreasuryChallan = async () => {
    if (!treasuryAmount) {
      alert("Please enter treasury amount");
      return;
    }

    try {
      const challanData = {
        tokenNo: `TOKEN-${Date.now()}`,
        bank: "Sonali Bank",
        branch: "Dhanmondi Branch",
        date: new Date().toISOString(),
        accountCode: "1/1143/0000-301",
        amountBdt: parseFloat(treasuryAmount),
        periodYear: selectedYear,
        periodMonth: selectedMonth,
      };

      const response = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challanData),
      });

      if (response.ok) {
        alert("Treasury challan added successfully!");
        await fetchData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to add treasury challan"}`);
      }
    } catch (error) {
      console.error("Error adding treasury challan:", error);
      alert("Failed to add treasury challan");
    }
  };

  const salesData = getCurrentMonthSales();
  const closingBalance = getCurrentClosingBalance();
  const vatComputation = getCurrentVATComputation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Monthly VAT Management
          </h1>
          <p className="text-muted-foreground">
            Compute VAT using closing balance and treasury challans
          </p>
        </div>
      </div>

      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Month for VAT Computation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
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
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Summary - {getMonthName(selectedMonth)} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">Gross Sales</p>
                    <p className="text-xl font-bold text-blue-900">
                      ৳{salesData.totalGross.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">Net Sales (Ex-VAT)</p>
                    <p className="text-xl font-bold text-green-900">
                      ৳{salesData.totalNet.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">VAT Payable (15%)</p>
                  <p className="text-2xl font-bold text-red-900">
                    ৳{salesData.totalVAT.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary">
                    {salesData.invoiceCount} invoices
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No sales data for selected month
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VAT Computation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              VAT Computation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vatComputation ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Used from Closing Balance
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    ৳{vatComputation.usedFromClosingBalance.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">Treasury Challan</p>
                  <p className="text-xl font-bold text-orange-900">
                    ৳{vatComputation.treasuryNeeded.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">Total Paid</p>
                  <p className="text-xl font-bold text-purple-900">
                    ৳
                    {(
                      vatComputation.usedFromClosingBalance +
                      vatComputation.treasuryNeeded
                    ).toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={vatComputation.locked ? "default" : "secondary"}
                >
                  {vatComputation.locked ? "Locked" : "Open"}
                </Badge>
              </div>
            ) : salesData ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="treasuryAmount">
                    Treasury Challan Amount
                  </Label>
                  <Input
                    id="treasuryAmount"
                    type="number"
                    step="0.01"
                    value={treasuryAmount}
                    onChange={(e) => setTreasuryAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter treasury amount, rest will be deducted from closing
                    balance
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usedFromClosing">
                    Amount from Closing Balance (Auto-calculated)
                  </Label>
                  <Input
                    id="usedFromClosing"
                    type="number"
                    step="0.01"
                    value={usedFromClosing}
                    readOnly
                    className="bg-gray-50"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: ৳
                    {closingBalance?.closingBalance.toLocaleString() || "0"}
                  </p>
                </div>

                {usedFromClosing && treasuryAmount && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">Total Payment:</p>
                    <p className="text-lg font-bold">
                      ৳
                      {(
                        parseFloat(usedFromClosing) + parseFloat(treasuryAmount)
                      ).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      VAT Required: ৳{salesData.totalVAT.toLocaleString()}
                    </p>
                  </div>
                )}

                <Button
                  onClick={computeVAT}
                  disabled={computing}
                  className="w-full"
                >
                  {computing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Computing VAT...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Compute VAT
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No sales data to compute VAT
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly VAT Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-2">Month</th>
                  <th className="text-right p-2">Gross Sales</th>
                  <th className="text-right p-2">VAT Payable</th>
                  <th className="text-right p-2">From Closing</th>
                  <th className="text-right p-2">Treasury</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vatComputations
                  .filter((v) => v.year >= 2022)
                  .sort((a, b) => a.year - b.year || a.month - b.month)
                  .map((vat) => (
                    <tr key={`${vat.year}-${vat.month}`}>
                      <td className="p-2">
                        {getMonthName(vat.month)} {vat.year}
                      </td>
                      <td className="text-right p-2">
                        ৳{vat.grossSales.toLocaleString()}
                      </td>
                      <td className="text-right p-2">
                        ৳{vat.vatPayable.toLocaleString()}
                      </td>
                      <td className="text-right p-2">
                        ৳{vat.usedFromClosingBalance.toLocaleString()}
                      </td>
                      <td className="text-right p-2">
                        ৳{vat.treasuryNeeded.toLocaleString()}
                      </td>
                      <td className="text-center p-2">
                        <Badge variant={vat.locked ? "default" : "secondary"}>
                          {vat.locked ? "Locked" : "Open"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
