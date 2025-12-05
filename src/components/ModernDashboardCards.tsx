"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  salesSummary: {
    totalGross: number;
    totalVAT: number;
    totalNet: number;
    count: number;
  };
  allTimeSales?: {
    totalGross: number;
    totalVAT: number;
    totalNet: number;
    count: number;
  };
  vatLedgerEntry: any;
  closingBalance: any;
  treasuryChallanSum: number;
  currentPeriod?: string;
}

interface ModernDashboardCardsProps {
  initialData?: DashboardData;
}

export default function ModernDashboardCards({
  initialData,
}: ModernDashboardCardsProps) {
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/summary");
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }

    // Auto refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);

    return () => clearInterval(interval);
  }, [initialData]);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }
  // Use current month data if available, otherwise show all-time data
  const activeSales =
    Number(data.salesSummary.count) > 0
      ? data.salesSummary
      : data.allTimeSales || data.salesSummary;
  const isCurrentMonth = Number(data.salesSummary.count) > 0;
  const periodLabel = isCurrentMonth
    ? `this month (${data.currentPeriod || ""})`
    : "all time";

  const cards = [
    {
      title: "Gross Sales",
      value: `৳${Number(activeSales.totalGross).toLocaleString()}`,
      subtitle: `${activeSales.count} invoices ${periodLabel}`,
      icon: DollarSign,
      trend: isCurrentMonth ? "+12.5%" : "Total",
      trendUp: isCurrentMonth,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Net Sales (Ex-VAT)",
      value: `৳${Number(activeSales.totalNet).toLocaleString()}`,
      subtitle: `After VAT deduction (${periodLabel})`,
      icon: TrendingUp,
      trend: isCurrentMonth ? "+8.2%" : "Total",
      trendUp: isCurrentMonth,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "VAT Payable",
      value: data.vatLedgerEntry
        ? `৳${Number(data.vatLedgerEntry.vatPayable).toLocaleString()}`
        : "Not computed",
      subtitle: "15% on period total",
      icon: CreditCard,
      trend: data.vatLedgerEntry ? "+15%" : "0%",
      trendUp: false,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Closing Balance Used",
      value: data.vatLedgerEntry
        ? `৳${Number(
            data.vatLedgerEntry.usedFromClosingBalance
          ).toLocaleString()}`
        : "৳0",
      subtitle: "From previous periods",
      icon: TrendingDown,
      trend: "-5.1%",
      trendUp: false,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Treasury Challan Needed",
      value: data.vatLedgerEntry
        ? `৳${Number(data.vatLedgerEntry.treasuryNeeded).toLocaleString()}`
        : "৳0",
      subtitle: "Remaining payment",
      icon: Banknote,
      trend: data.vatLedgerEntry ? "Due" : "None",
      trendUp: false,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Available Balance",
      value: `৳${
        data.closingBalance ? Number(data.closingBalance).toLocaleString() : "0"
      }`,
      subtitle: "Current period",
      icon: Wallet,
      trend: "+2.3%",
      trendUp: true,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">Sales Overview</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                  {card.title}
                </CardTitle>
                <div
                  className={`p-1.5 sm:p-2 rounded-lg ${card.bgColor} flex-shrink-0`}
                >
                  <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <div className="text-lg sm:text-2xl font-bold truncate">
                    {card.value}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {card.subtitle}
                    </p>
                    <Badge
                      variant={card.trendUp ? "default" : "secondary"}
                      className="text-xs flex-shrink-0"
                    >
                      {card.trend}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
