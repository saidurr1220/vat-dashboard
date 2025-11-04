"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Package,
  FileText,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  category: string;
  stock_on_hand: number;
  boe_no: string | null;
  sell_ex_vat: number;
}

export default function StockImportMismatchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<number | null>(null);

  useEffect(() => {
    fetchMismatchedProducts();
  }, []);

  const fetchMismatchedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products/stock-without-import");
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const createImportRecord = async (product: Product) => {
    setFixing(product.id);
    try {
      // Create a BOE record for this product
      const boeNo = product.boe_no || `MANUAL-${product.id}-${Date.now()}`;
      const response = await fetch("/api/imports/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boeNo: boeNo,
          boeDate: new Date().toISOString().split("T")[0],
          itemNo: "1",
          description: product.name,
          assessableValue: product.sell_ex_vat * product.stock_on_hand * 0.7, // Estimate
          vat: product.sell_ex_vat * product.stock_on_hand * 0.7 * 0.15,
          qty: product.stock_on_hand,
          unit: "PCS",
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update product with BOE number
        await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            boeNo: boeNo,
          }),
        });

        // Refresh the list
        fetchMismatchedProducts();
      }
    } catch (error) {
      console.error("Error creating import record:", error);
    } finally {
      setFixing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Stock-Import Mismatch
            </h1>
            <p className="text-gray-600 mt-2">
              Products with stock but no import records
            </p>
          </div>
          <Link href="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-12 h-12 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {products.length} Products Found
                </h2>
                <p className="text-gray-600">
                  These products have stock but no corresponding import records
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                All Clear!
              </h3>
              <p className="text-gray-600">
                All products with stock have corresponding import records.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Products Needing Import Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        BOE No
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {product.stock_on_hand}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-gray-600">
                            ৳{Number(product.sell_ex_vat).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {product.boe_no || "Not assigned"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => createImportRecord(product)}
                            disabled={fixing === product.id}
                            className="gap-2"
                          >
                            {fixing === product.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                Create Import
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  What does "Create Import" do?
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Creates a manual BOE record for the product</li>
                  <li>
                    Estimates import value based on current stock and price
                  </li>
                  <li>Links the product to the import record</li>
                  <li>Helps maintain accurate import-stock relationship</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
