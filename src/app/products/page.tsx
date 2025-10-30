import { db } from "@/db/client";
import { products, sales, salesLines, stockLedger } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import Link from "next/link";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Edit,
  Settings,
  AlertTriangle,
  CheckCircle,
  Minus,
} from "lucide-react";
import DashboardRefresh from "@/components/DashboardRefresh";

async function getProductsWithStock() {
  try {
    console.log("🔍 Starting getProductsWithStock...");

    // Use Drizzle ORM methods instead of raw SQL
    const productsData = await db.select().from(products);
    console.log(`📦 Found ${productsData.length} products using ORM`);

    if (productsData.length === 0) {
      console.log("❌ No products found in database!");
      return [];
    }

    // For now, return products with basic stock calculation
    const productsWithStock = productsData.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category || "Uncategorized",
      unit: product.unit,
      sku: product.sku || "",
      hsCode: product.hsCode || "",
      testsPerKit: product.testsPerKit,
      costExVat: Number(product.costExVat || 0),
      sellExVat: Number(product.sellExVat || 0),
      stockOnHand: 0, // We'll add stock calculation later
      totalSold: 0, // We'll add sales calculation later
    }));

    console.log(`✅ Returning ${productsWithStock.length} products`);
    return productsWithStock;
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return [];
  }
}

async function getProductStats() {
  try {
    // Use ORM to get basic product count
    const allProducts = await db.select().from(products);

    const totalProducts = allProducts.length;
    const footwearCount = allProducts.filter(
      (p) => p.category === "Footwear"
    ).length;
    const bioshieldCount = allProducts.filter(
      (p) => p.category === "BioShield"
    ).length;
    const fanCount = allProducts.filter((p) => p.category === "Fan").length;
    const instrumentCount = allProducts.filter(
      (p) => p.category === "Instrument"
    ).length;

    console.log(`📊 Stats: Total=${totalProducts}, Footwear=${footwearCount}`);

    return {
      totalProducts,
      footwearCount,
      bioshieldCount,
      fanCount,
      instrumentCount,
      totalStockValue: 0, // Simplified for now
    };
  } catch (error) {
    console.error("Error fetching product stats:", error);
    return {
      totalProducts: 0,
      footwearCount: 0,
      bioshieldCount: 0,
      fanCount: 0,
      instrumentCount: 0,
      totalStockValue: 0,
    };
  }
}

export default async function ProductsPage() {
  const productsData = await getProductsWithStock();
  const stats = await getProductStats();

  // Debug logging
  console.log("🔍 ProductsPage Debug:", {
    productsDataLength: productsData.length,
    statsTotal: stats.totalProducts,
    firstProduct: productsData[0]?.name || "No products",
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Footwear":
        return "bg-blue-100 text-blue-800";
      case "BioShield":
        return "bg-purple-100 text-purple-800";
      case "Fan":
        return "bg-green-100 text-green-800";
      case "Instrument":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock < 0) return { color: "text-red-600", icon: AlertTriangle };
    if (stock < 10) return { color: "text-orange-600", icon: Minus };
    return { color: "text-green-600", icon: CheckCircle };
  };

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
        <h2 className="font-bold text-yellow-800">Debug Info:</h2>
        <p className="text-yellow-700">Products found: {productsData.length}</p>
        <p className="text-yellow-700">
          Total products stat: {stats.totalProducts}
        </p>
        <p className="text-yellow-700">
          First product: {productsData[0]?.name || "None"}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Products & Stock
          </h1>
          <p className="text-muted-foreground">
            Manage inventory, pricing, and product information
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardRefresh />
          <Button variant="outline" asChild>
            <Link href="/products/stock/adjust">
              <Settings className="mr-2 h-4 w-4" />
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalProducts}
                </p>
                <p className="text-xs text-blue-700">All Categories</p>
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
                  Stock Value
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ৳{stats.totalStockValue.toLocaleString()}
                </p>
                <p className="text-xs text-green-700">Total Inventory</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Footwear</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.footwearCount}
                </p>
                <p className="text-xs text-purple-700">Products</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">BioShield</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.bioshieldCount}
                </p>
                <p className="text-xs text-orange-700">Test Kits</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsData.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first product
              </p>
              <Button asChild>
                <Link href="/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      HS Code
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Unit
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      Stock
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      Cost (Ex-VAT)
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      Sell (Ex-VAT)
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Sold Qty
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productsData.map((product) => {
                    const stockStatus = getStockStatus(product.stockOnHand);
                    const StatusIcon = stockStatus.icon;

                    return (
                      <tr key={product.id} className="hover:bg-muted/50">
                        <td className="p-3">
                          <div className="space-y-1">
                            <p className="font-medium">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="secondary"
                            className={getCategoryColor(product.category)}
                          >
                            {product.category || "Uncategorized"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-mono">
                            {product.hsCode || "-"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">{product.unit}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <StatusIcon
                              className={`h-4 w-4 ${stockStatus.color}`}
                            />
                            <span
                              className={`font-medium ${stockStatus.color}`}
                            >
                              {product.stockOnHand <= 0
                                ? "Stock Out"
                                : product.stockOnHand.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          ৳{Number(product.costExVat || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-medium">
                          ৳{Number(product.sellExVat || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                          >
                            {product.totalSold.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/products/${product.id}`}>
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/products/${product.id}/edit`}>
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BioShield Products Section */}
      {stats.bioshieldCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              BioShield Test Kits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-800 text-sm">
                BioShield reagents are sold by test count. Each kit contains
                multiple tests. Update per-test pricing and tests per kit for
                accurate calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsData
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes("bioshield") ||
                    p.category?.toLowerCase().includes("bioshield")
                )
                .map((product) => (
                  <Card key={product.id} className="border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {product.name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Tests per kit:
                          </span>
                          <span className="font-medium">
                            {product.testsPerKit || 120}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Per-test price:
                          </span>
                          <span className="font-medium">
                            ৳
                            {product.testsPerKit
                              ? (
                                  Number(product.sellExVat || 0) /
                                  product.testsPerKit
                                ).toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Stock on hand:
                          </span>
                          <span className="font-medium">
                            {product.stockOnHand.toLocaleString()} tests
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
