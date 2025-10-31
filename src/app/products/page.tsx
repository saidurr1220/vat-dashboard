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
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Products & Stock
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage inventory, pricing, and product information
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/products/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Fast Loading Products List */}
        <FastProductsList />
      </div>
    </div>
  );
}
