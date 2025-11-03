import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  TrendingUp,
  Banknote,
  Package,
  DollarSign,
  ShoppingCart,
  ArrowRight,
  AlertCircle,
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

        {/* VAT Reminder - Moved to top */}
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-1">
                Monthly VAT Reminder
              </h4>
              <p className="text-sm text-amber-800">
                Submit your VAT returns by the{" "}
                <strong>15th of each month</strong>. Current period:{" "}
                <strong>{currentMonth}</strong>
              </p>
            </div>
            <Link href="/vat/monthly">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Main KPI Cards */}
        <DashboardErrorBoundary>
          <DashboardKPIs />
        </DashboardErrorBoundary>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/sales/new">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600"
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="text-sm font-medium">New Sale</span>
              </Button>
            </Link>
            <Link href="/vat/monthly">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-600 hover:text-purple-600"
              >
                <Calculator className="w-6 h-6" />
                <span className="text-sm font-medium">Monthly VAT</span>
              </Button>
            </Link>
            <Link href="/products/stock">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-600"
              >
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium">Stock</span>
              </Button>
            </Link>
            <Link href="/imports/add">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-600 hover:text-green-600"
              >
                <DollarSign className="w-6 h-6" />
                <span className="text-sm font-medium">Add BOE</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Important Links - Modernized */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/vat/closing-balance"
            className="group relative overflow-hidden"
          >
            <div className="bg-white rounded-xl p-6 border-2 border-green-200 hover:border-green-400 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Banknote className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">
                  Closing Balance
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Manage VAT closing balance
                </p>
                <div className="flex items-center text-green-600 font-medium text-sm group-hover:gap-2 transition-all">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/treasury" className="group relative overflow-hidden">
            <div className="bg-white rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">
                  Treasury
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Manage treasury challans
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/vat-management"
            className="group relative overflow-hidden"
          >
            <div className="bg-white rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">
                  VAT Reports
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  View comprehensive reports
                </p>
                <div className="flex items-center text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
