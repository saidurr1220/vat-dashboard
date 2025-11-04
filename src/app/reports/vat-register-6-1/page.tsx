import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  ShoppingCart,
  TrendingUp,
  Calculator,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PurchaseRecord {
  boe_no: string;
  boe_date: string;
  supplier: string;
  description: string;
  assessable_value: number;
  vat: number;
  total_value: number;
}

interface SalesRecord {
  invoice_no: string;
  sale_date: string;
  customer: string;
  customer_bin: string | null;
  total_value: number;
  vat_amount: number;
  amount_type: string;
}

async function getVATRegisterData(month?: string, year?: string) {
  try {
    const currentDate = new Date();
    const targetMonth =
      month || (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const targetYear = year || currentDate.getFullYear().toString();

    // Part A: Purchases (Imports) - All imports for the month
    const purchasesResult = await db.execute(sql`
      SELECT 
        ib.boe_no,
        ib.boe_date,
        COALESCE(ib.office_code, 'Import') as supplier,
        ib.description,
        CAST(COALESCE(ib.assessable_value, 0) AS NUMERIC) as assessable_value,
        CAST(COALESCE(ib.vat, 0) AS NUMERIC) as vat,
        (CAST(COALESCE(ib.assessable_value, 0) AS NUMERIC) + 
         CAST(COALESCE(ib.base_vat, 0) AS NUMERIC) + 
         CAST(COALESCE(ib.sd, 0) AS NUMERIC) + 
         CAST(COALESCE(ib.vat, 0) AS NUMERIC) + 
         CAST(COALESCE(ib.at, 0) AS NUMERIC)) as total_value
      FROM imports_boe ib
      WHERE EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(targetMonth)}
        AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(targetYear)}
      ORDER BY ib.boe_date, ib.boe_no
    `);

    // Part B: Sales > 2 Lakh (VAT applicable sales)
    const salesResult = await db.execute(sql`
      SELECT 
        s.invoice_no,
        s.dt as sale_date,
        s.customer,
        c.bin as customer_bin,
        CAST(s.total_value AS NUMERIC) as total_value,
        CASE 
          WHEN s.amount_type = 'INCL' THEN CAST(s.total_value AS NUMERIC) * 0.15 / 1.15
          ELSE CAST(s.total_value AS NUMERIC) * 0.15
        END as vat_amount,
        s.amount_type
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
        AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
        AND CAST(s.total_value AS NUMERIC) > 200000
      ORDER BY s.dt, s.invoice_no
    `);

    // Calculate totals
    const purchaseTotals = {
      assessableValue: purchasesResult.rows.reduce(
        (sum, row: any) => sum + Number(row.assessable_value || 0),
        0
      ),
      vat: purchasesResult.rows.reduce(
        (sum, row: any) => sum + Number(row.vat || 0),
        0
      ),
      totalValue: purchasesResult.rows.reduce(
        (sum, row: any) => sum + Number(row.total_value || 0),
        0
      ),
    };

    const salesTotals = {
      totalValue: salesResult.rows.reduce(
        (sum, row: any) => sum + Number(row.total_value || 0),
        0
      ),
      vat: salesResult.rows.reduce(
        (sum, row: any) => sum + Number(row.vat_amount || 0),
        0
      ),
    };

    return {
      purchases: purchasesResult.rows as unknown as PurchaseRecord[],
      sales: salesResult.rows as unknown as SalesRecord[],
      purchaseTotals,
      salesTotals,
      netVAT: salesTotals.vat - purchaseTotals.vat,
    };
  } catch (error) {
    console.error("Error fetching VAT register data:", error);
    return {
      purchases: [],
      sales: [],
      purchaseTotals: { assessableValue: 0, vat: 0, totalValue: 0 },
      salesTotals: { totalValue: 0, vat: 0 },
      netVAT: 0,
    };
  }
}

export default async function VATRegister61Page({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const data = await getVATRegisterData(searchParams.month, searchParams.year);

  const currentDate = new Date();
  const displayMonth =
    searchParams.month ||
    (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const displayYear = searchParams.year || currentDate.getFullYear().toString();
  const monthName = new Date(
    parseInt(displayYear),
    parseInt(displayMonth) - 1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            VAT Register 6.1
          </h1>
          <p className="text-gray-600 mt-2">
            Purchase & Sales Register - {monthName}
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href={`/reports/vat-register-6-1?month=${displayMonth}&year=${displayYear}`}
            >
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Change Period
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Input VAT</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ৳{(data.purchaseTotals.vat / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-blue-700">From Purchases</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Output VAT
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    ৳{(data.salesTotals.vat / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-green-700">From Sales</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              data.netVAT >= 0
                ? "from-orange-50 to-orange-100 border-orange-200"
                : "from-red-50 to-red-100 border-red-200"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-medium ${
                      data.netVAT >= 0 ? "text-orange-800" : "text-red-800"
                    }`}
                  >
                    Net VAT
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      data.netVAT >= 0 ? "text-orange-900" : "text-red-900"
                    }`}
                  >
                    ৳{(Math.abs(data.netVAT) / 1000).toFixed(0)}K
                  </p>
                  <p
                    className={`text-xs ${
                      data.netVAT >= 0 ? "text-orange-700" : "text-red-700"
                    }`}
                  >
                    {data.netVAT >= 0 ? "Payable" : "Refundable"}
                  </p>
                </div>
                <Calculator
                  className={`h-8 w-8 ${
                    data.netVAT >= 0 ? "text-orange-600" : "text-red-600"
                  }`}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    ৳{(data.salesTotals.totalValue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-purple-700">
                    {data.sales.length} Invoices
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Part A and Part B */}
        <Tabs defaultValue="partA" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="partA">Part A: Purchases (Imports)</TabsTrigger>
            <TabsTrigger value="partB">
              Part B: Sales (&gt; ৳2 Lakh)
            </TabsTrigger>
          </TabsList>

          {/* Part A: Purchases */}
          <TabsContent value="partA">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Part A: Purchase Register (Imports)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          BOE No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Assessable Value
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          VAT
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.purchases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">
                                No purchase records found for {monthName}
                              </p>
                              <p className="text-sm mt-1">
                                Import some BOE records to see them here
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      {data.purchases.map((purchase, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {purchase.boe_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(purchase.boe_date).toLocaleDateString(
                              "en-GB"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {purchase.supplier}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {purchase.description || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            ৳
                            {Number(purchase.assessable_value).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                            ৳{Number(purchase.vat).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            ৳{Number(purchase.total_value).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-sm text-gray-900"
                        >
                          TOTAL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ৳
                          {data.purchaseTotals.assessableValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                          ৳{data.purchaseTotals.vat.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ৳{data.purchaseTotals.totalValue.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Part B: Sales */}
          <TabsContent value="partB">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Part B: Sales Register (Above ৳2 Lakh)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Invoice No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          BIN
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total Value
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          VAT (15%)
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.sales.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">
                                No sales above ৳2 Lakh found for {monthName}
                              </p>
                              <p className="text-sm mt-1">
                                Only sales above ৳2,00,000 are shown here (VAT
                                applicable)
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      {data.sales.map((sale, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.invoice_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(sale.sale_date).toLocaleDateString(
                              "en-GB"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {sale.customer}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {sale.customer_bin || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            ৳{Number(sale.total_value).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                            ৳{Number(sale.vat_amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge
                              variant={
                                sale.amount_type === "INCL"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {sale.amount_type}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-sm text-gray-900"
                        >
                          TOTAL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ৳{data.salesTotals.totalValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          ৳{data.salesTotals.vat.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* VAT Calculation Summary */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              VAT Calculation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Output VAT (Sales):</span>
                <span className="font-semibold text-green-600">
                  ৳{data.salesTotals.vat.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Input VAT (Purchases):</span>
                <span className="font-semibold text-blue-600">
                  - ৳{data.purchaseTotals.vat.toLocaleString()}
                </span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-900 font-bold">
                    Net VAT {data.netVAT >= 0 ? "Payable" : "Refundable"}:
                  </span>
                  <span
                    className={`font-bold text-xl ${
                      data.netVAT >= 0 ? "text-orange-600" : "text-red-600"
                    }`}
                  >
                    ৳{Math.abs(data.netVAT).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
