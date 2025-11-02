import { db } from "@/db/client";
import { products, sales, salesLines, stockLedger } from "@/db/schema";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Minus,
  Filter,
  Warehouse,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
} from "lucide-react";
import DashboardRefresh from "@/components/DashboardRefresh";
import ProductsWithFilters from "@/components/ProductsWithFilters";

// Force dynamic rendering
export const dynamic = "force-dynamic";

async function getStockData() {
  try {
    // Get products with stock information
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/products`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const productsData = await response.json();

    // Calculate stock statistics
    const totalProducts = productsData.length;
    const inStockProducts = productsData.filter(
      (p: any) => p.stockOnHand > 0
    ).length;
    const lowStockProducts = productsData.filter(
      (p: any) => p.stockOnHand > 0 && p.stockOnHand < 10
    ).length;
    const outOfStockProducts = productsData.filter(
      (p: any) => p.stockOnHand <= 0
    ).length;
    const totalStockValue = productsData.reduce(
      (sum: number, p: any) => sum + p.stockOnHand * p.costExVat,
      0
    );

    // Get monthly stock movement data
    const monthlyMovement = await getMonthlyStockMovement();

    // Get top selling products
    const topSellingProducts = await getTopSellingProducts();

    return {
      products: productsData,
      stats: {
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStockValue,
      },
      monthlyMovement,
      topSellingProducts,
    };
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return {
      products: [],
      stats: {
        totalProducts: 0,
        inStockProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalStockValue: 0,
      },
      monthlyMovement: [],
      topSellingProducts: [],
    };
  }
}

async function getMonthlyStockMovement() {
  try {
    // Get monthly sales data for stock movement analysis
    const monthlyData = await db.execute(sql`
      SELECT 
        EXTRACT(YEAR FROM s.dt) as year,
        EXTRACT(MONTH FROM s.dt) as month,
        COUNT(DISTINCT s.id) as total_sales,
        SUM(CAST(sl.qty AS NUMERIC)) as total_qty_sold,
        SUM(CAST(sl.line_total_calc AS NUMERIC)) as total_value,
        COUNT(DISTINCT sl.product_id) as unique_products_sold
      FROM sales s
      JOIN sales_lines sl ON s.id = sl.sale_id
      WHERE s.dt >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(YEAR FROM s.dt), EXTRACT(MONTH FROM s.dt)
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);

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

    return monthlyData.rows.map((row: any) => ({
      period: `${monthNames[Number(row.month) - 1]} ${row.year}`,
      year: Number(row.year),
      month: Number(row.month),
      totalSales: Number(row.total_sales),
      totalQtySold: Number(row.total_qty_sold),
      totalValue: Number(row.total_value),
      uniqueProductsSold: Number(row.unique_products_sold),
    }));
  } catch (error) {
    console.error("Error fetching monthly movement:", error);
    return [];
  }
}

async function getTopSellingProducts() {
  try {
    // Get top selling products by quantity
    const topProducts = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.unit,
        p.stock_on_hand,
        SUM(CAST(sl.qty AS NUMERIC)) as total_sold,
        COUNT(DISTINCT s.id) as sales_count,
        AVG(CAST(sl.unit_price_value AS NUMERIC)) as avg_price
      FROM products p
      JOIN sales_lines sl ON p.id = sl.product_id
      JOIN sales s ON sl.sale_id = s.id
      WHERE s.dt >= CURRENT_DATE - INTERVAL '3 months'
      GROUP BY p.id, p.name, p.unit, p.stock_on_hand
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    return topProducts.rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      unit: row.unit,
      stockOnHand: Number(row.stock_on_hand),
      totalSold: Number(row.total_sold),
      salesCount: Number(row.sales_count),
      avgPrice: Number(row.avg_price),
    }));
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return [];
  }
}

export default async function StockPage() {
  const { products, stats, monthlyMovement, topSellingProducts } =
    await getStockData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Warehouse className="h-8 w-8" />
            Stock Management
          </h1>
          <p className="text-muted-foreground">
            Monitor inventory levels and stock status
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardRefresh />
          <Button variant="outline" asChild>
            <Link href="/products/stock/adjust">
              <Plus className="mr-2 h-4 w-4" />
              Adjust Stock
            </Link>
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Items</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalProducts}
                </p>
                <p className="text-xs text-blue-700">All products</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">In Stock</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.inStockProducts}
                </p>
                <p className="text-xs text-green-700">Available items</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Low Stock</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.lowStockProducts}
                </p>
                <p className="text-xs text-orange-700">Need reorder</p>
              </div>
              <Minus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Out of Stock</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.outOfStockProducts}
                </p>
                <p className="text-xs text-red-700">Urgent restock</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Stock Value
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  ৳{stats.totalStockValue.toLocaleString()}
                </p>
                <p className="text-xs text-purple-700">Total inventory</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              In Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products
                .filter((p: any) => p.stockOnHand > 10)
                .slice(0, 5)
                .map((product: any) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium truncate">
                      {product.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {product.stockOnHand.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              {products.filter((p: any) => p.stockOnHand > 10).length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{products.filter((p: any) => p.stockOnHand > 10).length - 5}{" "}
                  more items
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <Minus className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products
                .filter((p: any) => p.stockOnHand > 0 && p.stockOnHand <= 10)
                .slice(0, 5)
                .map((product: any) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium truncate">
                      {product.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-200"
                    >
                      {product.stockOnHand.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              {products.filter(
                (p: any) => p.stockOnHand > 0 && p.stockOnHand <= 10
              ).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No low stock items
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products
                .filter((p: any) => p.stockOnHand <= 0)
                .slice(0, 5)
                .map((product: any) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium truncate">
                      {product.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200"
                    >
                      Out
                    </Badge>
                  </div>
                ))}
              {products.filter((p: any) => p.stockOnHand <= 0).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  All items in stock
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Stock Status Dashboard */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-50 to-blue-50 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            Current Stock Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-blue-100">
              <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProducts}
              </p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-green-100">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {((stats.inStockProducts / stats.totalProducts) * 100).toFixed(
                  1
                )}
                %
              </p>
              <p className="text-sm text-gray-600">Stock Availability</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
              <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {stats.lowStockProducts}
              </p>
              <p className="text-sm text-gray-600">Low Stock Items</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-purple-100">
              <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                ৳{(stats.totalStockValue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600">Inventory Value</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Dashboard - Monthly Movement & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Monthly Stock Movement */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Monthly Stock Movement Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyMovement.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-900">
                      {monthlyMovement
                        .reduce((sum, m) => sum + m.totalQtySold, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">Total Units Sold</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-900">
                      ৳
                      {(
                        monthlyMovement.reduce(
                          (sum, m) => sum + m.totalValue,
                          0
                        ) / 1000000
                      ).toFixed(1)}
                      M
                    </p>
                    <p className="text-xs text-blue-600">Total Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-900">
                      {Math.round(
                        monthlyMovement.reduce(
                          (sum, m) => sum + m.totalQtySold,
                          0
                        ) / monthlyMovement.length
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">Avg Monthly Sales</p>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                {monthlyMovement.slice(0, 6).map((month, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {month.period}
                        </p>
                        <p className="text-xs text-gray-600">
                          {month.totalSales} transactions •{" "}
                          {month.uniqueProductsSold} different products
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                        <span className="font-bold text-red-600">
                          {month.totalQtySold.toLocaleString()} units
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        ৳{month.totalValue.toLocaleString()} revenue
                      </p>
                      <p className="text-xs text-blue-600">
                        Avg: ৳
                        {(month.totalValue / month.totalSales).toLocaleString()}
                        /sale
                      </p>
                    </div>
                  </div>
                ))}
                {monthlyMovement.length > 6 && (
                  <p className="text-xs text-center text-gray-500 pt-2">
                    +{monthlyMovement.length - 6} more months available
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No stock movement data available</p>
                <p className="text-sm mt-2">
                  Start making sales to see movement analytics
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Top Selling Products */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Performing Products (Last 3 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSellingProducts.length > 0 ? (
              <div className="space-y-3">
                {/* Performance Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-900">
                      {topSellingProducts
                        .reduce((sum, p) => sum + p.totalSold, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      Units by Top Products
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-900">
                      ৳
                      {(
                        topSellingProducts.reduce(
                          (sum, p) => sum + p.totalSold * p.avgPrice,
                          0
                        ) / 1000000
                      ).toFixed(1)}
                      M
                    </p>
                    <p className="text-xs text-green-600">Revenue Generated</p>
                  </div>
                </div>

                {/* Product Rankings */}
                {topSellingProducts.slice(0, 8).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          index === 0
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-400 to-gray-600"
                            : index === 2
                            ? "bg-gradient-to-br from-orange-400 to-orange-600"
                            : "bg-gradient-to-br from-green-500 to-emerald-500"
                        }`}
                      >
                        <span className="text-white font-bold text-sm">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {product.salesCount} transactions • Avg price: ৳
                          {product.avgPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-green-600">
                          {product.totalSold.toLocaleString()} sold
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Package className="w-3 h-3 text-gray-400" />
                        <span
                          className={`${
                            product.stockOnHand < 10
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          Stock: {product.stockOnHand.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">
                        Revenue: ৳
                        {(
                          product.totalSold * product.avgPrice
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {topSellingProducts.length > 8 && (
                  <p className="text-xs text-center text-gray-500 pt-2">
                    +{topSellingProducts.length - 8} more products in analysis
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No sales data available</p>
                <p className="text-sm mt-2">
                  Start making sales to see top performers
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Analytics Summary */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Stock Analytics Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                ৳{stats.totalStockValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {monthlyMovement.length > 0
                  ? monthlyMovement[0].totalQtySold.toLocaleString()
                  : "0"}
              </p>
              <p className="text-sm text-gray-600">Last Month Movement</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {monthlyMovement.length > 0
                  ? monthlyMovement[0].totalQtySold.toLocaleString()
                  : "0"}
              </p>
              <p className="text-sm text-gray-600">Last Month Movement</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {topSellingProducts.length > 0
                  ? topSellingProducts[0].totalSold.toLocaleString()
                  : "0"}
              </p>
              <p className="text-sm text-gray-600">Top Product Sales</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products with Filters */}
      <ProductsWithFilters products={products} />
    </div>
  );
}
