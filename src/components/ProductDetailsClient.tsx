"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, TrendingUp, Settings } from "lucide-react";
import StockAdjustment from "./StockAdjustment";

interface SoldItem {
  id: number;
  invoiceNo: string;
  date: string;
  customer: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface ProductDetailsClientProps {
  product: {
    id: number;
    name: string;
    stockOnHand: number;
  };
}

export default function ProductDetailsClient({
  product,
}: ProductDetailsClientProps) {
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [currentStock, setCurrentStock] = useState(product.stockOnHand);

  useEffect(() => {
    fetchSoldItems();
  }, [product.id]);

  const fetchSoldItems = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}/sales`);
      if (response.ok) {
        const data = await response.json();
        setSoldItems(data);
      }
    } catch (error) {
      console.error("Error fetching sold items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentComplete = () => {
    setShowAdjustment(false);
    // Refresh the page to get updated stock
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Stock Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Management
            </div>
            <Button
              onClick={() => setShowAdjustment(!showAdjustment)}
              variant={showAdjustment ? "secondary" : "default"}
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdjustment ? "Cancel" : "Adjust Stock"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {currentStock}
              </div>
              <div className="text-sm text-blue-700">Current Stock</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {soldItems.length}
              </div>
              <div className="text-sm text-green-700">Total Sales</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {soldItems.reduce((sum, item) => sum + item.qty, 0)}
              </div>
              <div className="text-sm text-purple-700">Total Sold Qty</div>
            </div>
          </div>

          {showAdjustment && (
            <StockAdjustment
              productId={product.id}
              productName={product.name}
              currentStock={currentStock}
              onAdjustmentComplete={handleAdjustmentComplete}
            />
          )}
        </CardContent>
      </Card>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sales History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">
                Loading sales history...
              </p>
            </div>
          ) : soldItems.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Invoice</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Unit Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {soldItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-2">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          <Badge variant="outline">{item.invoiceNo}</Badge>
                        </td>
                        <td className="py-2">{item.customer}</td>
                        <td className="py-2 text-right font-medium">
                          {item.qty}
                        </td>
                        <td className="py-2 text-right">
                          ৳{item.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-bold">
                          ৳{item.lineTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Sales:</span>
                    <div className="font-bold">{soldItems.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Quantity:
                    </span>
                    <div className="font-bold">
                      {soldItems.reduce((sum, item) => sum + item.qty, 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Revenue:
                    </span>
                    <div className="font-bold">
                      ৳
                      {soldItems
                        .reduce((sum, item) => sum + item.lineTotal, 0)
                        .toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Price:</span>
                    <div className="font-bold">
                      ৳
                      {soldItems.length > 0
                        ? (
                            soldItems.reduce(
                              (sum, item) => sum + item.unitPrice,
                              0
                            ) / soldItems.length
                          ).toFixed(2)
                        : "0"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No sales history found for this product
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
