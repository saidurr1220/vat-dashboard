import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Package, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

interface StockMovement {
  product_id: number;
  product_name: string;
  category: string;
  opening_stock: number;
  purchases: number;
  sales: number;
  closing_stock: number;
  unit_price: number;
  opening_value: number;
  purchase_value: number;
  sales_value: number;
  closing_value: number;
}

async function getSaleRegisterData(month?: string, year?: string) {
  try {
    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1).toString();
    const targetYear = year || currentDate.getFullYear().toString();

    // Simplified query - just show current stock and sales for the month
    const result = await db.execute(sql`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COALESCE(p.category, 'General') as category,
        p.stock_on_hand as closing_stock,
        p.sell_ex_vat as unit_price,
        
        -- Sales during month
        COALESCE((
          SELECT SUM(CAST(slines.qty AS NUMERIC))
          FROM sales_lines slines
          JOIN sales s ON slines.sale_id = s.id
          WHERE slines.product_id = p.id
          AND EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
        ), 0) as sales,
        
        -- Purchases from imports (BOE) during month
        COALESCE((
          SELECT SUM(CAST(ib.qty AS NUMERIC))
          FROM imports_boe ib
          WHERE p.boe_no = ib.boe_no
          AND EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(targetYear)}
        ), 0) as purchases,
        
        -- Calculate opening stock (closing + sales - purchases)
        (p.stock_on_hand + COALESCE((
          SELECT SUM(CAST(slines.qty AS NUMERIC))
          FROM sales_lines slines
          JOIN sales s ON slines.sale_id = s.id
          WHERE slines.product_id = p.id
          AND EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
        ), 0) - COALESCE((
          SELECT SUM(CAST(ib.qty AS NUMERIC))
          FROM imports_boe ib
          WHERE p.boe_no = ib.boe_no
          AND EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(targetYear)}
        ), 0)) as opening_stock,
        
        -- Values
        (p.stock_on_hand * p.sell_ex_vat) as closing_value,
        ((p.stock_on_hand + COALESCE((
          SELECT SUM(CAST(slines.qty AS NUMERIC))
          FROM sales_lines slines
          JOIN sales s ON slines.sale_id = s.id
          WHERE slines.product_id = p.id
          AND EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
        ), 0) - COALESCE((
          SELECT SUM(CAST(ib.qty AS NUMERIC))
          FROM imports_boe ib
          WHERE p.boe_no = ib.boe_no
          AND EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(targetYear)}
        ), 0)) * p.sell_ex_vat) as opening_value,
        
        (COALESCE((
          SELECT SUM(CAST(ib.qty AS NUMERIC))
          FROM imports_boe ib
          WHERE p.boe_no = ib.boe_no
          AND EXTRACT(MONTH FROM ib.boe_date) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM ib.boe_date) = ${parseInt(targetYear)}
        ), 0) * p.sell_ex_vat) as purchase_value,
        
        (COALESCE((
          SELECT SUM(CAST(slines.qty AS NUMERIC))
          FROM sales_lines slines
          JOIN sales s ON slines.sale_id = s.id
          WHERE slines.product_id = p.id
          AND EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
          AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
        ), 0) * p.sell_ex_vat) as sales_value
        
      FROM products p
      WHERE p.stock_on_hand > 0 
         OR EXISTS (
           SELECT 1 FROM sales_lines slines
           JOIN sales s ON slines.sale_id = s.id
           WHERE slines.product_id = p.id
           AND EXTRACT(MONTH FROM s.dt) = ${parseInt(targetMonth)}
           AND EXTRACT(YEAR FROM s.dt) = ${parseInt(targetYear)}
         )
      ORDER BY category, product_name
    `);

    return result.rows as unknown as StockMovement[];
  } catch (error) {
    console.error("Error fetching sale register data:", error);
    return [];
  }
}

export default async function SaleRegister62Page({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const movements = await getSaleRegisterData(
    searchParams.month,
    searchParams.year
  );

  const currentDate = new Date();
  const displayMonth =
    searchParams.month || (currentDate.getMonth() + 1).toString();
  const displayYear = searchParams.year || currentDate.getFullYear().toString();
  const monthName = new Date(
    parseInt(displayYear),
    parseInt(displayMonth) - 1
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Calculate totals
  const totals = movements.reduce(
    (acc, item) => ({
      openingValue: acc.openingValue + Number(item.opening_value),
      purchaseValue: acc.purchaseValue + Number(item.purchase_value),
      salesValue: acc.salesValue + Number(item.sales_value),
      closingValue: acc.closingValue + Number(item.closing_value),
    }),
    { openingValue: 0, purchaseValue: 0, salesValue: 0, closingValue: 0 }
  );

  // Group by category
  const groupedByCategory = movements.reduce((acc, item) => {
    const category = item.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, StockMovement[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Sale Register 6.2
          </h1>
          <p className="text-gray-600 mt-2">
            Stock Movement Report - {monthName}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Opening Stock
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    ৳{(totals.openingValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Purchases
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    ৳{(totals.purchaseValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Sales</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ৳{(totals.salesValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Closing Stock
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    ৳{(totals.closingValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Movement Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Opening
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Purchases
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Closing
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Closing Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium">
                            No stock movement data for {monthName}
                          </p>
                          <p className="text-sm mt-1">
                            Add products and make sales to see stock movements
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {Object.entries(groupedByCategory).map(
                    ([category, items]) => (
                      <>
                        <tr key={category} className="bg-gray-100">
                          <td
                            colSpan={7}
                            className="px-6 py-3 font-semibold text-gray-900"
                          >
                            {category}
                          </td>
                        </tr>
                        {items.map((item) => (
                          <tr
                            key={item.product_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.product_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                              {Number(item.opening_stock).toFixed(0)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-green-600">
                              {Number(item.purchases).toFixed(0)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-red-600">
                              {Number(item.sales).toFixed(0)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                              {Number(item.closing_stock).toFixed(0)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                              ৳{Number(item.unit_price).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                              ৳{Number(item.closing_value).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </>
                    )
                  )}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ৳{totals.closingValue.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
