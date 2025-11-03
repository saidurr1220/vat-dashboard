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

        {/* Important Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/vat/closing-balance" className="group">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-5 border border-green-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <Banknote className="w-8 h-8 text-green-600" />
                <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-green-900 mb-1">
                Closing Balance
              </h3>
              <p className="text-sm text-green-700">
                Manage VAT closing balance
              </p>
            </div>
          </Link>

          <Link href="/treasury" className="group">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-5 border border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-blue-900 mb-1">Treasury</h3>
              <p className="text-sm text-blue-700">Manage treasury challans</p>
            </div>
          </Link>

          <Link href="/vat-management" className="group">
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-5 border border-purple-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <Calculator className="w-8 h-8 text-purple-600" />
                <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-purple-900 mb-1">
                VAT Reports
              </h3>
              <p className="text-sm text-purple-700">
                View comprehensive reports
              </p>
            </div>
          </Link>
        </div>

        {/* Important Notice */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">
                Monthly VAT Reminder
              </h4>
              <p className="text-sm text-amber-800">
                Submit your VAT returns by the 15th of each month. Current
                month: <strong>{currentMonth}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
