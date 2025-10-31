"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Minus,
  Filter,
  Search,
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  sku: string;
  hsCode: string;
  testsPerKit: number | null;
  costExVat: number;
  sellExVat: number;
  stockOnHand: number;
  totalSold: number;
}

interface ProductsWithFiltersProps {
  products: Product[];
}

export default function ProductsWithFilters({
  products,
}: ProductsWithFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category || "Uncategorized"))
    );
    return uniqueCategories.sort();
  }, [products]);

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (product.category || "Uncategorized") === selectedCategory;

      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku &&
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.hsCode &&
          product.hsCode.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

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
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
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
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {products.length === 0
                ? "No products found"
                : "No products match your filters"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {products.length === 0
                ? "Start by adding your first product"
                : "Try adjusting your search or category filter"}
            </p>
            {products.length === 0 && (
              <Button asChild>
                <Link href="/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Product
                </Link>
              </Button>
            )}
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
                {filteredProducts.map((product) => {
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
                          <span className={`font-medium ${stockStatus.color}`}>
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
  );
}
