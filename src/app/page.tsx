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
  FileText,
  Users,
  BarChart3,
} from "lucide-react";

// Force dynamic for real-time data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Dashboard() {
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Simple Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">VAT Dashboard</h1>
          <p className="text-gray-600 mt-1">
            M S RAHMAN TRADERS - {currentMonth}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/sales/new" className="group">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">New Sale</h3>
              <p className="text-sm text-gray-500">Create sales invoice</p>
            </div>
          </Link>

          <Link href="/customers" className="group">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <Users className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Customers</h3>
              <p className="text-sm text-gray-500">Manage customers</p>
            </div>
          </Link>

          <Link href="/products" className="group">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Package className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Products</h3>
              <p className="text-sm text-gray-500">Inventory management</p>
            </div>
          </Link>

          <Link href="/treasury" className="group">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <Banknote className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Treasury</h3>
              <p className="text-sm text-gray-500">VAT payments</p>
            </div>
          </Link>
        </div>

        {/* VAT Reports Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">VAT Reports</h2>
            <Link href="/vat/reports">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/reports/vat-register-6-1" className="group">
              <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">
                        Mushok 6.1
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Purchase Register - Imports
                    </p>
                    <div className="text-xs text-blue-600 font-medium">
                      View Report →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/reports/sale-register-6-2" className="group">
              <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">
                        Mushok 6.2
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Sales Register</p>
                    <div className="text-xs text-purple-600 font-medium">
                      View Report →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/reports/mushok-6-10" className="group">
              <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">
                        Mushok 6.10
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      High Value Transactions
                    </p>
                    <div className="text-xs text-orange-600 font-medium">
                      View Report →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* VAT Management Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/vat/monthly" className="group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-xl mb-2">Monthly VAT</h3>
              <p className="text-blue-100 text-sm mb-4">
                Calculate and submit VAT returns
              </p>
              <div className="text-xs bg-white/20 rounded px-2 py-1 inline-block">
                Current Period: {currentMonth}
              </div>
            </div>
          </Link>

          <Link href="/vat/closing-balance" className="group">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-xl mb-2">Closing Balance</h3>
              <p className="text-green-100 text-sm mb-4">
                Manage VAT closing balance
              </p>
              <div className="text-xs bg-white/20 rounded px-2 py-1 inline-block">
                Track Balance
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
