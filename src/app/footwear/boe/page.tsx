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
  const filteredLots = selectedCategory === "all" 
    ? lots 
    : lots.filter(lot => lot.category === selectedCategory);

  const categoryStats = categories.slice(1).map(cat => {
    const categoryLots = lots.filter(lot => lot.category === cat);
    const totalPairs = categoryLots.reduce((sum, lot) => sum + lot.closingPairs, 0);
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
          <h1 className="text-3xl font-bold tracking-tight">Footwear BoE Lots</h1>
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
                  <p className="text-sm font-medium capitalize">{stat.category}</p>