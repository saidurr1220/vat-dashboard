import { db } from "@/db/client";
import {
  sales,
  vatLedger,
  treasuryChallans,
  closingBalance,
} from "@/db/schema";
import { sql, eq, and, gte, lte } from "drizzle-orm";
import Link from "next/link";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fetch fresh data

async function getVATReports() {
  try {
    const currentYear = 2025;
    const currentMonth = 10;

    // Get monthly VAT summary for both 2022 and 2025
    const monthlyVAT2025 = await db
      .select({
        year: sql<number>`2025`,
        month: sql<number>`EXTRACT(MONTH FROM ${sales.dt})`,
        grossSales: sql<number>`COALESCE(SUM(${sales.totalValue}), 0)`,
        vatAmount: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${sales.amountType} = 'INCL' 
          THEN ${sales.totalValue}::numeric - (${sales.totalValue}::numeric / 1.15)
          ELSE ${sales.totalValue}::numeric * 0.15
        END
      ), 0)`,
        netSales: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${sales.amountType} = 'INCL' 
          THEN ${sales.totalValue}::numeric / 1.15
          ELSE ${sales.totalValue}::numeric
        END
      ), 0)`,
        salesCount: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(sql`EXTRACT(YEAR FROM ${sales.dt}) = 2025`)
      .groupBy(sql`EXTRACT(MONTH FROM ${sales.dt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${sales.dt})`);

    const monthlyVAT2022 = await db
      .select({
        year: sql<number>`2022`,
        month: sql<number>`EXTRACT(MONTH FROM ${sales.dt})`,
        grossSales: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${sales.amountType} = 'INCL' 
          THEN ${sales.totalValue}::numeric
          ELSE ${sales.totalValue}::numeric + (${sales.totalValue}::numeric * 0.15)
        END
      ), 0)`,
        vatAmount: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${sales.amountType} = 'INCL' 
          THEN ${sales.totalValue}::numeric - (${sales.totalValue}::numeric / 1.15)
          ELSE ${sales.totalValue}::numeric * 0.15
        END
      ), 0)`,
        netSales: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${sales.amountType} = 'INCL' 
          THEN ${sales.totalValue}::numeric / 1.15
          ELSE ${sales.totalValue}::numeric
        END
      ), 0)`,
        salesCount: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(sql`EXTRACT(YEAR FROM ${sales.dt}) = 2022`)
      .groupBy(sql`EXTRACT(MONTH FROM ${sales.dt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${sales.dt})`);

    const monthlyVAT = [...monthlyVAT2022, ...monthlyVAT2025];

    // Get VAT ledger entries for both years
    const vatLedgerEntries2025 = await db
      .select()
      .from(vatLedger)
      .where(eq(vatLedger.periodYear, 2025))
      .orderBy(vatLedger.periodMonth);

    const vatLedgerEntries2022 = await db
      .select()
      .from(vatLedger)
      .where(eq(vatLedger.periodYear, 2022))
      .orderBy(vatLedger.periodMonth);

    const vatLedgerEntries = [...vatLedgerEntries2022, ...vatLedgerEntries2025];

    // Get treasury challans for both years
    const treasuryData2025 = await db
      .select({
        year: sql<number>`2025`,
        periodMonth: treasuryChallans.periodMonth,
        totalAmount: sql<number>`COALESCE(SUM(${treasuryChallans.amountBdt}), 0)`,
        challanCount: sql<number>`COUNT(*)`,
      })
      .from(treasuryChallans)
      .where(eq(treasuryChallans.periodYear, 2025))
      .groupBy(treasuryChallans.periodMonth)
      .orderBy(treasuryChallans.periodMonth);

    const treasuryData2022 = await db
      .select({
        year: sql<number>`2022`,
        periodMonth: treasuryChallans.periodMonth,
        totalAmount: sql<number>`COALESCE(SUM(${treasuryChallans.amountBdt}), 0)`,
        challanCount: sql<number>`COUNT(*)`,
      })
      .from(treasuryChallans)
      .where(eq(treasuryChallans.periodYear, 2022))
      .groupBy(treasuryChallans.periodMonth)
      .orderBy(treasuryChallans.periodMonth);

    const treasuryData = [...treasuryData2022, ...treasuryData2025];

    // Get closing balance with fallback
    let closingBalanceData = 0;
    try {
      // Try old format first (most likely to exist)
      const closingBalanceResult = await db.execute(sql`
      SELECT amount_bdt as balance
      FROM closing_balance 
      WHERE period_year = ${currentYear} AND period_month = ${currentMonth}
      LIMIT 1
    `);

      if (closingBalanceResult.rows.length > 0) {
        closingBalanceData = parseFloat(
          (closingBalanceResult.rows[0] as any).balance || "0"
        );
      }
    } catch (error) {
      console.log("Closing balance table might not exist:", error);
      closingBalanceData = 0;
    }

    return {
      vatLedgerEntries,
      treasuryData,
      closingBalance: closingBalanceData,
    };
  } catch (error) {
    console.error("Error fetching VAT reports:", error);
    return {
      monthlyVAT: [],
      vatLedgerEntries: [],
      treasuryData: [],
      closingBalance: 0,
    };
  }
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default async function VATReportsPage() {
  const data = await getVATReports();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VAT Reports</h1>
          <p className="text-gray-600">
            Monthly, quarterly, and yearly VAT summaries
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vat/compute"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Compute VAT
          </Link>
          <Link
            href="/vat/export"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Export Reports
          </Link>
        </div>
      </div>

      {/* Current Period Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">
            Current Period
          </div>
          <div className="text-2xl font-bold text-gray-900">Oct 2025</div>
          <div className="text-sm text-gray-600">Tax Period</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">
            Closing Balance
          </div>
          <div className="text-2xl font-bold text-green-600">
            ৳
            {data.closingBalance
              ? Number(data.closingBalance).toLocaleString()
              : "0"}
          </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">VAT Computed</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.vatLedgerEntries.length}
          </div>
          <div className="text-sm text-gray-600">Periods</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Treasury Paid</div>
          <div className="text-2xl font-bold text-orange-600">
            ৳
            {data.treasuryData
              .reduce((sum, t) => sum + Number(t.totalAmount), 0)
              .toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">This Year</div>
        </div>
      </div>

      {/* VAT Ledger Entries */}
      {data.vatLedgerEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">VAT Ledger Entries</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VAT Payable
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used from Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treasury Needed
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.vatLedgerEntries.map((entry) => (
                  <tr
                    key={`${entry.periodYear}-${entry.periodMonth}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {monthNames[entry.periodMonth - 1]} {entry.periodYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ৳{Number(entry.vatPayable).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                      ৳{Number(entry.usedFromClosingBalance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                      ৳{Number(entry.treasuryNeeded).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {entry.locked ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Unlocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Treasury Challans Summary */}
      {data.treasuryData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Treasury Challans (2025)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Challans Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.treasuryData.map((treasury) => (
                  <tr key={treasury.periodMonth} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {monthNames[treasury.periodMonth - 1]} 2025
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {Number(treasury.challanCount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ৳{Number(treasury.totalAmount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
