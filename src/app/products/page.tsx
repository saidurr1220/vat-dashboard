import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Settings, DollarSign, RefreshCw } from "lucide-react";
import FastProductsList from "@/components/FastProductsList";

// Use static generation for better performance
export const dynamic = "force-static";
export const revalidate = 60; // Revalidate every minute

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Products & Inventory Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              Complete product catalog with real-time stock tracking
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Card className="bg-white/80 backdrop-blur-sm shadow-sm border-0 px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Live inventory tracking</span>
                </div>
              </Card>
            </div>

            <div className="flex gap-2">
              <Link href="/products/stock">
                <Button variant="outline" className="gap-2">
                  <DollarSign className="w-4 h-4" />
                  Stock Management
                </Button>
              </Link>
              <Link href="/products/new">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Products List with Business Analytics */}
        <FastProductsList />
      </div>
    </div>
  );
}
