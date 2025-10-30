"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Calendar, Hash } from "lucide-react";
import Link from "next/link";

interface BoELot {
  id: number;
  lotId: string;
  boeNumber: number;
  boeItemNo: number;
  boeDate: string;
  description: string;
  hsCode: string;
  baseValue: string;
  sdValue: string;
  unitPurchaseCost: string;
  category: string;
  month: string;
  cartonSize: number;
  openingPairs: number;
  closingPairs: number;
  declaredUnitValue: string;
}

export default function FootwearBoEPage() {
  const [lots, setLots] = useState<BoELot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchBoELots();
  }, []);

  const fetchBoELots = async () => {
    try {
      const response = await fetch("/api/footwear/boe/lots");
      if (response.ok) {
        const data = await response.json();
        setLots(data.lots || []);
      }
    } catch (error) {
      console.error("Error fetching BoE lots:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", "mens", "ladies", "boys", "baby"];
  const filteredLots =
    selectedCategory === "all"
      ? lots
      : lots.filter((lot) => lot.category === selectedCategory);

  const categoryStats = categories.slice(1).map((cat) => {
    const categoryLots = lots.filter((lot) => lot.category === cat);
    const totalPairs = categoryLots.reduce(
      (sum, lot) => sum + lot.closingPairs,
      0
    );
    return { category: cat, lots: categoryLots.length, pairs: totalPairs };
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/footwear">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Footwear
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Footwear BoE Lots
          </h1>
          <p className="text-muted-foreground">
            FIFO inventory tracking from Bill of Entry imports
          </p>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categoryStats.map((stat) => (
          <Card key={stat.category}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium capitalize">
                    {stat.category}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.pairs.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.lots} lots
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="capitalize"
          >
            {cat === "all" ? "All Categories" : cat}
          </Button>
        ))}
      </div>

      {/* BoE Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            BoE Lots ({filteredLots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLots.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lots found</h3>
              <p className="text-muted-foreground">
                {selectedCategory === "all"
                  ? "No BoE lots available"
                  : `No lots found for ${selectedCategory} category`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Lot ID
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      BoE Details
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      Stock
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      Unit Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{lot.lotId}</div>
                        <div className="text-sm text-muted-foreground">
                          HS: {lot.hsCode}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">BoE #{lot.boeNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          Item {lot.boeItemNo} • {lot.boeDate}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{lot.description}</div>
                        <div className="text-sm text-muted-foreground">
                          Carton: {lot.cartonSize} pairs
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {lot.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-medium">
                          {lot.closingPairs.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          pairs
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-medium">
                          ৳{parseFloat(lot.unitPurchaseCost).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per pair
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
    </div>
  );
}
