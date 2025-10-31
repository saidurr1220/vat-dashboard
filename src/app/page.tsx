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

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {staticFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const getIconColor = (title: string) => {
              if (title.includes("VAT")) return "from-blue-500 to-indigo-500";
              if (title.includes("Footwear"))
                return "from-orange-500 to-red-500";
              if (title.includes("Products"))
                return "from-green-500 to-emerald-500";
              if (title.includes("Sales")) return "from-purple-500 to-pink-500";
              if (title.includes("Treasury"))
                return "from-yellow-500 to-orange-500";
              return "from-gray-500 to-slate-500";
            };

            return (
              <ModernCard key={index} hover className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${getIconColor(
                      feature.title
                    )} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {feature.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>
                <Link href={feature.href}>
                  <Button
                    variant="outline"
                    className="w-full gap-2 group-hover:bg-blue-50"
                  >
                    Open {feature.title}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </ModernCard>
            );
          })}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard>
            <ModernCardHeader
              title="System Status"
              subtitle="Current system health"
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">Database</h4>
                <p className="text-xs text-gray-600">Connected</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Banknote className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">
                  VAT System
                </h4>
                <p className="text-xs text-gray-600">Operational</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">Period</h4>
                <p className="text-xs text-gray-600">November 2025</p>
              </div>
            </div>
          </ModernCard>

          <ModernCard>
            <ModernCardHeader
              title="Quick Actions"
              subtitle="Common tasks"
              icon={<Zap className="w-5 h-5" />}
            />
            <div className="space-y-3">
              <Link href="/products/new">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Package className="w-4 h-4" />
                  Add New Product
                </Button>
              </Link>
              <Link href="/sales/new">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Create Sale
                </Button>
              </Link>
              <Link href="/vat/monthly">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  VAT Calculation
                </Button>
              </Link>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}
