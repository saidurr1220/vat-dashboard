"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Archive,
} from "lucide-react";

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
  createdAt: string;
}

interface BoESummary {
  totalLots: number;
  totalOpeningPairs: number;
  totalClosingPairs: number;
  totalBaseValue: number;
  totalSdValue: number;
  averageUnitCost: number;
  oldestLot: BoELot | null;
  newestLot: BoELot | null;
}

interface BoEDataDisplayProps {
  productId: number;
  productName: string;
}

export default function BoEDataDisplay({
  productId,
  productName,
}: BoEDataDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState<BoELot[]>([]);
  const [summary, setSummary] = useState<BoESummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoEData();
  }, [productId]);

  const fetchBoEData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}/boe`);

      if (!response.ok) {
        throw new Error("Failed to fetch BoE data");
      }

      const data = await response.json();
      setLots(data.lots);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2 text-gray-600">Loading BoE data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Archive className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading BoE Data
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchBoEData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!lots.length) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Archive className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No BoE Data
        </h3>
        <p className="text-gray-600">
          No BoE import records found for this product.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Lots
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {summary.totalLots}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Total Pairs
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {summary.totalOpeningPairs.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Sold Pairs
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {(
                      summary.totalOpeningPairs - summary.totalClosingPairs
                    ).toLocaleString()}
                  </p>
                </div>
                <Archive className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    ৳{summary.totalBaseValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BoE Lots Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-orange-600" />
            BoE Import Lots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    BoE Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date & Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pairs
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Values
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Unit Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lots.map((lot) => (
                  <tr
                    key={lot.id}
                    className="hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          BoE #{lot.boeNumber}-{lot.boeItemNo}
                        </div>
                        <div className="text-sm text-gray-600">
                          Lot: {lot.lotId}
                        </div>
                        <div className="text-xs text-gray-500">
                          HS: {lot.hsCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {new Date(lot.boeDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {lot.category}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <div className="font-semibold text-green-600">
                          {lot.openingPairs.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Remaining: {lot.closingPairs.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <div className="font-semibold text-blue-600">
                          ৳{parseFloat(lot.baseValue).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          SD: ৳{parseFloat(lot.sdValue).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-purple-600">
                        ৳{parseFloat(lot.unitPurchaseCost).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
