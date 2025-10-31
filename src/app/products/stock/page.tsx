import { db } from "@/db/client";
import { products } from "@/db/schema";
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

    return {
      products: productsData,
      stats: {
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStockValue,
      },
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
    };
  }
}

export default async function StockPage() {
  const { products, stats } = await getStockData();

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

      {/* Product Inventory with Filters */}
      <ProductsWithFilters products={products} />
    </div>
  );
}
