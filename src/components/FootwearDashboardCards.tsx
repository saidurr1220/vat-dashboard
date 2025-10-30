"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Users,
  TrendingUp,
  BarChart3,
  Baby,
  User,
} from "lucide-react";

interface FootwearStockData {
  categoryTotals: Array<{
    footwear_category: string;
    total_pairs: number;
    unique_products: number;
    lot_count: number;
  }>;
  stockSummary: any[];
}

export default function FootwearDashboardCards() {
  const [footwearData, setFootwearData] = useState<FootwearStockData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchFootwearData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/footwear/stock");
      if (response.ok) {
        const data = await response.json();
        setFootwearData(data);
      }
    } catch (error) {
      console.error("Failed to fetch footwear data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFootwearData();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchFootwearData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (
    !footwearData ||
    !footwearData.categoryTotals ||
    footwearData.categoryTotals.length === 0
  ) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No footwear data available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Import your footwear BoE data to see statistics
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPairs = footwearData.categoryTotals.reduce(
    (sum, cat) => sum + Number(cat.total_pairs),
    0
  );
  const totalProducts = footwearData.categoryTotals.reduce(
    (sum, cat) => sum + Number(cat.unique_products),
    0
  );
  const totalLots = footwearData.categoryTotals.reduce(
    (sum, cat) => sum + Number(cat.lot_count),
    0
  );

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "ladies":
        return User;
      case "mens":
        return Users;
      case "boys":
        return User;
      case "baby":
        return Baby;
      default:
        return Package;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "ladies":
        return {
          color: "text-pink-600",
          bg: "bg-pink-50",
          border: "border-pink-200",
        };
      case "mens":
        return {
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
      case "boys":
        return {
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
        };
      case "baby":
        return {
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200",
        };
      default:
        return {
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Total Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Stock</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalPairs.toLocaleString()} pairs
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
                <p className="text-sm font-medium text-green-800">Products</p>
                <p className="text-2xl font-bold text-green-900">
                  {totalProducts}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">BoE Lots</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totalLots}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {footwearData.categoryTotals.map((category) => {
          const Icon = getCategoryIcon(category.footwear_category);
          const colors = getCategoryColor(category.footwear_category);

          return (
            <Card
              key={category.footwear_category}
              className={`${colors.bg} ${colors.border}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {category.footwear_category}
                </CardTitle>
                <Icon className={`h-4 w-4 ${colors.color}`} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {Number(category.total_pairs).toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">pairs</p>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {Number(category.unique_products)} products
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Number(category.lot_count)} lots
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
