"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/ui/kpi-card";
import {
  KPICardSkeleton,
  TableSkeleton,
} from "@/components/ui/loading-skeleton";
import { Package, DollarSign, Search, Filter, Plus } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  sku: string;
  hsCode: string;
  costExVat: number;
  sellExVat: number;
  stockOnHand: number;
}

export default function FastProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          setFilteredProducts(data);

          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(data.map((p: Product) => p.category || "General"))
          ) as string[];
          setCategories(uniqueCategories.sort());
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter products when search or category changes
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (p) => (p.category || "General") === selectedCategory
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    totalStockValue: products.reduce(
      (sum, p) => sum + p.stockOnHand * p.costExVat,
      0
    ),
    footwearCount: products.filter((p) => p.category === "Footwear").length,
    reagentCount: products.filter((p) => p.category === "Reagent").length,
  };

  if (loading) {
    return (
      <>
        {/* Stats Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>

        {/* Table Skeleton */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Loading Products...</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={8} />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="All categories"
          icon={<Package className="w-5 h-5" />}
          color="blue"
          size="md"
        />

        <KPICard
          title="Stock Value"
          value={`৳${stats.totalStockValue.toLocaleString()}`}
          subtitle="Total inventory"
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
          size="md"
        />

        <KPICard
          title="Footwear"
          value={stats.footwearCount}
          subtitle="Products"
          icon={<Package className="w-5 h-5" />}
          color="purple"
          size="md"
        />

        <KPICard
          title="Reagents"
          value={stats.reagentCount}
          subtitle="Test kits"
          icon={<Package className="w-5 h-5" />}
          color="orange"
          size="md"
        />
      </div>

      {/* Products Table */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Inventory ({filteredProducts.length} items)
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {products.length === 0
                  ? "No products found"
                  : "No products match your filters"}
              </h3>
              <p className="text-gray-600 mb-4">
                {products.length === 0
                  ? "Start by adding your first product"
                  : "Try adjusting your search or category filter"}
              </p>
              {products.length === 0 && (
                <Link href="/products/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">
                      Product
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-gray-600">
                      Category
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-gray-600">
                      Unit
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600">
                      Stock
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600">
                      Cost (Ex-VAT)
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600">
                      Sell (Ex-VAT)
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="text-xs text-gray-500">
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {product.category || "General"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-xs">
                          {product.unit}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-medium ${
                            product.stockOnHand > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.stockOnHand > 0
                            ? product.stockOnHand.toLocaleString()
                            : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900">
                        ৳{product.costExVat.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900">
                        ৳{product.sellExVat.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
