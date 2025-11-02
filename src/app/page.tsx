import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModernCard, ModernCardHeader } from "@/components/ui/modern-card";
import {
  Calculator,
  TrendingUp,
  Banknote,
  Calendar,
  CheckCircle,
  ArrowRight,
  Package,
  Archive,
  ShoppingCart,
  Zap,
  BarChart3,
} from "lucide-react";
import DashboardKPIs from "@/components/DashboardKPIs";

// Use static generation for better performance
export const dynamic = "force-static";
export const revalidate = 300; // Revalidate every 5 minutes

// Static data for immediate loading
const staticFeatures = [
  {
    title: "Products & Stock",
    description: "Manage inventory, pricing, and product information",
    icon: Package,
    href: "/products",
    status: "ready",
  },
  {
    title: "Sales Management",
    description: "Track sales, invoices, and customer transactions",
    icon: ShoppingCart,
    href: "/sales",
    status: "ready",
  },
  {
    title: "VAT Closing Balance",
    description:
      "Track and manage VAT closing balances with bank statement format",
    icon: Banknote,
    href: "/vat/closing-balance",
    status: "ready",
  },
  {
    title: "Monthly VAT Calculation",
    description: "Calculate monthly VAT obligations and treasury requirements",
    icon: Calculator,
    href: "/vat/monthly",
    status: "ready",
  },
  {
    title: "Footwear System",
    description: "Advanced footwear inventory with BoE import tracking",
    icon: Archive,
    href: "/footwear",
    status: "ready",
  },
  {
    title: "Treasury Management",
    description: "Manage treasury challans and payments",
    icon: TrendingUp,
    href: "/treasury",
    status: "ready",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Business Dashboard
                </h1>
                <p className="text-gray-600 text-sm">M S RAHMAN TRADERS</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-2 text-xs">
                <Calendar className="w-3 h-3" />
                November 2025
              </Badge>
              <Badge className="gap-2 bg-green-600 text-xs">
                <CheckCircle className="w-3 h-3" />
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Cards - Load via client component */}
        <DashboardKPIs />

        {/* Quick Stats Overview */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Business Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Sales Performance
                </h3>
                <p className="text-gray-600">
                  Track your sales revenue, VAT calculations, and monthly
                  performance metrics.
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  VAT Compliance
                </h3>
                <p className="text-gray-600">
                  Monitor VAT obligations, treasury payments, and closing
                  balance utilization.
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Import Management
                </h3>
                <p className="text-gray-600">
                  Manage BOE entries, import VAT, and advance tax payments
                  efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
