"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface StockItem {
  id: number;
  name: string;
  unit: string;
  stockOnHand: number;
  stockValue: number;
  stockValueVat: number;
  stockValueIncVat: number;
}

interface StockSummaryData {
  items: StockItem[];
  totals: {
    totalStockValue: number;
    totalStockValueVat: number;
    totalStockValueIncVat: number;
  };
}

export default function ModernStockSummary() {
  const [stockData, setStockData] = useState<StockSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStockSummary = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/stock/summary");
      if (response.ok) {
        const data = await response.json();
        setStockData(data);
      }
    } catch (error) {
      console.error("Failed to fetch stock summary:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStockSummary();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stockData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Failed to load stock data
          </p>
          <Button onClick={fetchStockSummary} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Summary
        </CardTitle>
        <Button
          onClick={fetchStockSummary}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Totals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Stock Value (Ex VAT)
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    ৳{stockData.totals.totalStockValue.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    VAT Amount
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    ৳{stockData.totals.totalStockValueVat.toLocaleString()}
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
                  <p className="text-sm font-medium text-purple-800">
                    Stock Value (Inc VAT)
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    ৳{stockData.totals.totalStockValueIncVat.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Items Table */}
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Value (Ex VAT)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    VAT
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Value (Inc VAT)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stockData.items
                  .filter((item) => item.stockOnHand > 0)
                  .slice(0, 10) // Show top 10 items
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary">
                          {item.stockOnHand.toLocaleString()} {item.unit}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ৳{item.stockValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        ৳{item.stockValueVat.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        ৳{item.stockValueIncVat.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {stockData.items.filter((item) => item.stockOnHand > 0).length >
            10 && (
            <div className="p-4 text-center border-t bg-muted/25">
              <p className="text-sm text-muted-foreground">
                Showing top 10 items. Total items in stock:{" "}
                {stockData.items.filter((item) => item.stockOnHand > 0).length}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
