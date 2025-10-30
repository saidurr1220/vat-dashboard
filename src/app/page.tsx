import { db } from "@/db/client";
import {
  sales,
  vatLedger,
  closingBalance,
  treasuryChallans,
} from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";
import VATComputeButton from "@/components/VATComputeButton";
import ModernDashboardCards from "@/components/ModernDashboardCards";
import ModernStockSummary from "@/components/ModernStockSummary";
import FootwearDashboardCards from "@/components/FootwearDashboardCards";
import DashboardRefresh from "@/components/DashboardRefresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";

async function getDashboardData() {
  const currentYear = 2025;
  const currentMonth = 10; // October 2025

  // Get current month sales summary
  const salesSummary = await db
    .select({
      totalGross: sql<number>`COALESCE(SUM(${sales.totalValue}), 0)`,
      totalVAT: sql<number>`COALESCE(SUM((CASE WHEN ${sales.amountType} = 'INCL' THEN ${sales.totalValue} - (${sales.totalValue} * 0.15 / 1.15) ELSE ${sales.totalValue} END) * 0.15), 0)`,
      totalNet: sql<number>`COALESCE(SUM(CASE WHEN ${sales.amountType} = 'INCL' THEN ${sales.totalValue} - (${sales.totalValue} * 0.15 / 1.15) ELSE ${sales.totalValue} END), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(
      and(
        sql`EXTRACT(YEAR FROM ${sales.dt}) = ${currentYear}`,
        sql`EXTRACT(MONTH FROM ${sales.dt}) = ${currentMonth}`
      )
    );

  // Get VAT ledger for current period
  const vatLedgerEntry = await db
    .select()
    .from(vatLedger)
    .where(
      and(
        eq(vatLedger.periodYear, currentYear),
        eq(vatLedger.periodMonth, currentMonth)
      )
    )
    .limit(1);

  // Get current closing balance with fallback
  let currentClosingBalance = 0;
  try {
    // Try old format first (most likely to exist)
    const currentClosingBalanceResult = await db.execute(sql`
      SELECT amount_bdt as balance
      FROM closing_balance 
      WHERE period_year = ${currentYear} AND period_month = ${currentMonth}
      LIMIT 1
    `);

    if (currentClosingBalanceResult.rows.length > 0) {
      currentClosingBalance = parseFloat(
        (currentClosingBalanceResult.rows[0] as any).balance || "0"
      );
    }
  } catch (error) {
    console.log("Closing balance table might not exist:", error);
    currentClosingBalance = 0;
  }

  // Get treasury challans for current month
  const treasuryChallanSum = await db
    .select({
      total: sql<number>`COALESCE(SUM(${treasuryChallans.amountBdt}), 0)`,
    })
    .from(treasuryChallans)
    .where(
      and(
        eq(treasuryChallans.periodYear, currentYear),
        eq(treasuryChallans.periodMonth, currentMonth)
      )
    );

  return {
    salesSummary: salesSummary[0],
    vatLedgerEntry: vatLedgerEntry[0] || null,
    closingBalance: currentClosingBalance,
    treasuryChallanSum: treasuryChallanSum[0].total,
  };
}

export default async function Dashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            VAT & Sales Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">M S RAHMAN TRADERS</p>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="outline" className="text-xs">
              October 2025 Tax Period
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <DashboardRefresh />
          <VATComputeButton />
        </div>
      </div>

      {/* Dashboard Cards */}
      <ModernDashboardCards initialData={data} />

      {/* Footwear Dashboard */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Footwear Stock Overview</h2>
        <FootwearDashboardCards />
      </div>

      {/* Stock Summary */}
      <ModernStockSummary />

      {/* Activity & VAT Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Recent Activity
            </CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-muted-foreground">
                  Total Sales This Month
                </span>
              </div>
              <Badge variant="secondary">{data.salesSummary.count}</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-muted-foreground">
                  Treasury Challans
                </span>
              </div>
              <span className="font-medium">
                ৳{Number(data.treasuryChallanSum).toLocaleString()}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm text-muted-foreground">
                  Closing Balance Available
                </span>
              </div>
              <span className="font-medium">
                ৳
                {data.closingBalance
                  ? Number(data.closingBalance).toLocaleString()
                  : "0"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* VAT Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">VAT Summary</CardTitle>
            <Badge variant="outline" className="text-xs">
              Oct 2025
            </Badge>
          </CardHeader>
          <CardContent>
            {data.vatLedgerEntry ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">
                      VAT Payable
                    </span>
                  </div>
                  <span className="font-medium text-red-600">
                    ৳{Number(data.vatLedgerEntry.vatPayable).toLocaleString()}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      Used from Closing Balance
                    </span>
                  </div>
                  <span className="font-medium text-green-600">
                    ৳
                    {Number(
                      data.vatLedgerEntry.usedFromClosingBalance
                    ).toLocaleString()}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      Treasury Challan Needed
                    </span>
                  </div>
                  <span className="font-medium text-orange-600">
                    ৳
                    {Number(
                      data.vatLedgerEntry.treasuryNeeded
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  No VAT computation for this period yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Compute VAT for Oct 2025" to calculate.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
