import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  TrendingUp,
  Banknote,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Package,
  DollarSign,
  ShoppingCart,
  Zap,
  BarChart3,
  Calendar,
  TrendingDown,
  Activity,
  Target,
  Percent,
} from "lucide-react";
import DashboardKPIs from "@/components/DashboardKPIs";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardErrorBoundary from "@/components/DashboardErrorBoundary";

// Force dynamic for real-time data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Dashboard() {
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <DashboardHeader />

        {/* Dynamic KPI Cards */}
        <DashboardErrorBoundary>
          <DashboardKPIs />
        </DashboardErrorBoundary>

        {/* Business Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* VAT Compliance Status */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">VAT Status</h3>
                  <p className="text-sm text-purple-700">{currentMonth}</p>
                </div>
              </div>
              <Badge className="bg-purple-600">Active</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-800">Compliance Rate</span>
                <span className="font-bold text-purple-900">98%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: "98%" }}
                ></div>
              </div>
              <Link href="/vat/monthly">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-2">
                  <Calculator className="w-4 h-4 mr-2" />
                  Compute Monthly VAT
                </Button>
              </Link>
            </div>
          </div>

          {/* Cash Flow Insight */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Cash Flow</h3>
                  <p className="text-sm text-green-700">This Month</p>
                </div>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Revenue Trend</span>
                <span className="font-bold text-green-900 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12.5%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Profit Margin</span>
                <span className="font-bold text-green-900">~25%</span>
              </div>
              <Link href="/sales">
                <Button className="w-full bg-green-600 hover:bg-green-700 mt-2">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Sales
                </Button>
              </Link>
            </div>
          </div>

          {/* Inventory Health */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 border-2 border-orange-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900">Inventory</h3>
                  <p className="text-sm text-orange-700">Stock Health</p>
                </div>
              </div>
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-800">Turnover Rate</span>
                <span className="font-bold text-orange-900">Good</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-800">Stock Days</span>
                <span className="font-bold text-orange-900">~45 days</span>
              </div>
              <Link href="/products/stock">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-2">
                  <Package className="w-4 h-4 mr-2" />
                  Manage Stock
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Monthly Target */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8 text-blue-600" />
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-600"
              >
                Target
              </Badge>
            </div>
            <h4 className="text-sm font-medium text-gray-600 mb-1">
              Monthly Goal
            </h4>
            <p className="text-2xl font-bold text-gray-900">৳2.5M</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "65%" }}
                ></div>
              </div>
              <span className="text-gray-600">65%</span>
            </div>
          </div>

          {/* VAT Payable */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Calculator className="w-8 h-8 text-purple-600" />
              <Badge
                variant="outline"
                className="text-purple-600 border-purple-600"
              >
                Due
              </Badge>
            </div>
            <h4 className="text-sm font-medium text-gray-600 mb-1">
              VAT Payable
            </h4>
            <p className="text-2xl font-bold text-gray-900">Check Monthly</p>
            <Link
              href="/vat/monthly"
              className="mt-3 text-sm text-purple-600 hover:underline flex items-center gap-1"
            >
              Calculate Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Closing Balance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Banknote className="w-8 h-8 text-green-600" />
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                Available
              </Badge>
            </div>
            <h4 className="text-sm font-medium text-gray-600 mb-1">
              Closing Balance
            </h4>
            <p className="text-2xl font-bold text-gray-900">View Details</p>
            <Link
              href="/vat/closing-balance"
              className="mt-3 text-sm text-green-600 hover:underline flex items-center gap-1"
            >
              Manage Balance <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Profit Margin */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Percent className="w-8 h-8 text-emerald-600" />
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-600"
              >
                Margin
              </Badge>
            </div>
            <h4 className="text-sm font-medium text-gray-600 mb-1">
              Avg Profit
            </h4>
            <p className="text-2xl font-bold text-gray-900">~25%</p>
            <p className="mt-3 text-sm text-gray-500">Based on sales data</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/sales/new">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-blue-600 hover:text-blue-600"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-medium">New Sale</span>
              </Button>
            </Link>
            <Link href="/products/new">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-green-600 hover:text-green-600"
              >
                <Package className="w-5 h-5" />
                <span className="text-sm font-medium">Add Product</span>
              </Button>
            </Link>
            <Link href="/imports/add">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-purple-600 hover:text-purple-600"
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Add BOE</span>
              </Button>
            </Link>
            <Link href="/vat-management">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-orange-600 hover:text-orange-600"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">VAT Reports</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Business Tips */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  VAT Compliance
                </h4>
                <p className="text-sm text-blue-700">
                  Submit your monthly VAT returns by the 15th of each month to
                  avoid penalties.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">
                  Stock Management
                </h4>
                <p className="text-sm text-green-700">
                  Monitor your inventory turnover rate to optimize stock levels
                  and reduce holding costs.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900 mb-1">
                  Closing Balance
                </h4>
                <p className="text-sm text-orange-700">
                  Utilize your closing balance strategically to reduce treasury
                  payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
