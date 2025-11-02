import { db } from "@/db/client";
import { importsBoe, sales, salesLines } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

async function getVATData() {
  try {
    // Get Import VAT (Input VAT) - VAT paid on imports
    const importVATResult = await db.execute(sql`
      SELECT 
        COALESCE(SUM(CAST(vat AS NUMERIC)), 0) as total_import_vat,
        COALESCE(SUM(CAST(at AS NUMERIC)), 0) as total_advance_tax,
        COUNT(*) as total_import_records
      FROM imports_boe
      WHERE vat IS NOT NULL AND vat > 0
    `);

    // Get Sales VAT (Output VAT) - VAT collected on sales
    // Calculate VAT from sales based on amount_type
    const salesVATResult = await db.execute(sql`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN s.amount_type = 'INCL' THEN CAST(s.total_value AS NUMERIC) * 0.15 / 1.15
            ELSE CAST(s.total_value AS NUMERIC) * 0.15
          END
        ), 0) as total_sales_vat,
        COALESCE(SUM(CAST(s.total_value AS NUMERIC)), 0) as total_sales_amount,
        COUNT(DISTINCT s.id) as total_sales_records
      FROM sales s
      WHERE s.total_value IS NOT NULL AND s.total_value > 0
    `);

    // Get monthly breakdown
    const monthlyVATResult = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', boe_date) as month,
        COALESCE(SUM(CAST(vat AS NUMERIC)), 0) as import_vat,
        COALESCE(SUM(CAST(at AS NUMERIC)), 0) as advance_tax,
        COUNT(*) as records
      FROM imports_boe
      WHERE boe_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', boe_date)
      ORDER BY month DESC
    `);

    const monthlySalesVATResult = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', dt) as month,
        COALESCE(SUM(
          CASE 
            WHEN amount_type = 'INCL' THEN CAST(total_value AS NUMERIC) * 0.15 / 1.15
            ELSE CAST(total_value AS NUMERIC) * 0.15
          END
        ), 0) as sales_vat,
        COUNT(*) as records
      FROM sales
      WHERE dt >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', dt)
      ORDER BY month DESC
    `);

    const importVAT = Number(importVATResult.rows[0]?.total_import_vat || 0);
    const advanceTax = Number(importVATResult.rows[0]?.total_advance_tax || 0);
    const salesVAT = Number(salesVATResult.rows[0]?.total_sales_vat || 0);
    const totalSalesAmount = Number(
      salesVATResult.rows[0]?.total_sales_amount || 0
    );

    // Calculate VAT closing balance
    // Input VAT (paid on imports) - Output VAT (collected on sales) = Net VAT Position
    const vatClosingBalance = importVAT - salesVAT;

    return {
      importVAT,
      advanceTax,
      salesVAT,
      totalSalesAmount,
      vatClosingBalance,
      importRecords: Number(importVATResult.rows[0]?.total_import_records || 0),
      salesRecords: Number(salesVATResult.rows[0]?.total_sales_records || 0),
      monthlyImportVAT: monthlyVATResult.rows,
      monthlySalesVAT: monthlySalesVATResult.rows,
    };
  } catch (error) {
    console.error("Error fetching VAT data:", error);
    return {
      importVAT: 0,
      advanceTax: 0,
      salesVAT: 0,
      totalSalesAmount: 0,
      vatClosingBalance: 0,
      importRecords: 0,
      salesRecords: 0,
      monthlyImportVAT: [],
      monthlySalesVAT: [],
    };
  }
}

export default async function VATManagementPage() {
  const vatData = await getVATData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Calculator className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          VAT Management
        </h1>
        <p className="text-gray-600 mt-2">
          Import VAT, Sales VAT, and Closing Balance Tracking
        </p>
      </div>

      {/* VAT Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Import VAT</p>
                <p className="text-2xl font-bold text-blue-900">
                  ৳{(vatData.importVAT / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-blue-700">Input VAT Paid</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Sales VAT</p>
                <p className="text-2xl font-bold text-green-900">
                  ৳{(vatData.salesVAT / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-green-700">Output VAT Collected</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Advance Tax
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  ৳{(vatData.advanceTax / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-purple-700">AT Paid on Imports</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${
            vatData.vatClosingBalance >= 0
              ? "from-orange-50 to-orange-100 border-orange-200"
              : "from-red-50 to-red-100 border-red-200"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    vatData.vatClosingBalance >= 0
                      ? "text-orange-800"
                      : "text-red-800"
                  }`}
                >
                  VAT Balance
                </p>
                <p
                  className={`text-2xl font-bold ${
                    vatData.vatClosingBalance >= 0
                      ? "text-orange-900"
                      : "text-red-900"
                  }`}
                >
                  ৳{(Math.abs(vatData.vatClosingBalance) / 1000).toFixed(0)}K
                </p>
                <p
                  className={`text-xs ${
                    vatData.vatClosingBalance >= 0
                      ? "text-orange-700"
                      : "text-red-700"
                  }`}
                >
                  {vatData.vatClosingBalance >= 0
                    ? "Credit Balance"
                    : "Payable"}
                </p>
              </div>
              <DollarSign
                className={`h-8 w-8 ${
                  vatData.vatClosingBalance >= 0
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VAT Calculation Explanation */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            VAT Calculation Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
              <div className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-blue-600" />
                Input VAT (Import)
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Import VAT:</span>
                  <span className="font-medium">
                    ৳{vatData.importVAT.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Import Records:</span>
                  <span className="font-medium">{vatData.importRecords}</span>
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  VAT paid on imported goods (15% of assessable value)
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
              <div className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Output VAT (Sales)
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Sales VAT:</span>
                  <span className="font-medium">
                    ৳{vatData.salesVAT.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Records:</span>
                  <span className="font-medium">{vatData.salesRecords}</span>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  VAT collected from customers on sales
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
              <div className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-purple-600" />
                Net VAT Position
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Input VAT:</span>
                  <span className="font-medium">
                    ৳{vatData.importVAT.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Output VAT:</span>
                  <span className="font-medium">
                    ৳{vatData.salesVAT.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Net Balance:</span>
                  <span
                    className={
                      vatData.vatClosingBalance >= 0
                        ? "text-orange-600"
                        : "text-red-600"
                    }
                  >
                    ৳{Math.abs(vatData.vatClosingBalance).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-purple-600 mt-2">
                  {vatData.vatClosingBalance >= 0
                    ? "Credit balance - can be adjusted against future VAT liability"
                    : "Amount payable to government"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Monthly VAT Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Import VAT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales VAT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Position
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advance Tax
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vatData.monthlyImportVAT.map((importMonth: any) => {
                  const salesMonth = vatData.monthlySalesVAT.find(
                    (s: any) => s.month === importMonth.month
                  );
                  const importVAT = Number(importMonth.import_vat || 0);
                  const salesVAT = Number(salesMonth?.sales_vat || 0);
                  const netPosition = importVAT - salesVAT;
                  const advanceTax = Number(importMonth.advance_tax || 0);

                  return (
                    <tr key={importMonth.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(importMonth.month).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                        ৳{importVAT.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        ৳{salesVAT.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          netPosition >= 0 ? "text-orange-600" : "text-red-600"
                        }`}
                      >
                        ৳{Math.abs(netPosition).toLocaleString()}
                        <span className="text-xs ml-1">
                          {netPosition >= 0 ? "(Credit)" : "(Payable)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                        ৳{advanceTax.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
