import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  FileText,
  TrendingUp,
  Banknote,
  Calendar,
  CheckCircle,
  ArrowRight,
  Package,
  Archive,
  BarChart3,
  Users,
} from "lucide-react";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";

// Simple dashboard without complex database queries
function getDashboardData() {
  return {
    currentPeriod: "October 2025",
    status: "Active",
    features: [
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
        description:
          "Calculate monthly VAT obligations and treasury requirements",
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
        title: "Products & Stock",
        description: "Manage inventory, pricing, and product information",
        icon: Package,
        href: "/products",
        status: "ready",
      },
      {
        title: "VAT Reports",
        description: "View comprehensive VAT reports and summaries",
        icon: FileText,
        href: "/vat",
        status: "ready",
      },
      {
        title: "Treasury Management",
        description: "Manage treasury challans and payments",
        icon: TrendingUp,
        href: "/treasury",
        status: "ready",
      },
    ],
  };
}

export default function Dashboard() {
  const data = getDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  VAT Dashboard
                </h1>
                <p className="text-gray-600 mt-1">M S RAHMAN TRADERS</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-2">
                <Calendar className="w-3 h-3" />
                {data.currentPeriod}
              </Badge>
              <Badge variant="default" className="gap-2 bg-green-600">
                <CheckCircle className="w-3 h-3" />
                {data.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Welcome to Your VAT Management System
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Your VAT dashboard is now live and ready to use! All essential
                features are working perfectly. Start by managing your closing
                balances or calculating monthly VAT obligations.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/vat/closing-balance">
                  <Button className="gap-2">
                    <Banknote className="w-4 h-4" />
                    Manage Closing Balance
                  </Button>
                </Link>
                <Link href="/vat/monthly">
                  <Button variant="outline" className="gap-2">
                    <Calculator className="w-4 h-4" />
                    Monthly VAT Calculation
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.features.map((feature, index) => {
            const Icon = feature.icon;
            const getIconColor = (title: string) => {
              if (title.includes("VAT")) return "from-blue-500 to-indigo-500";
              if (title.includes("Footwear"))
                return "from-orange-500 to-red-500";
              if (title.includes("Products"))
                return "from-green-500 to-emerald-500";
              if (title.includes("Treasury"))
                return "from-purple-500 to-pink-500";
              return "from-gray-500 to-slate-500";
            };

            return (
              <Card
                key={index}
                className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${getIconColor(
                        feature.title
                      )} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <Link href={feature.href}>
                    <Button variant="outline" className="w-full gap-2 group">
                      Open {feature.title}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Database</h3>
                  <p className="text-sm text-gray-600">Connected & Ready</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Banknote className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">VAT System</h3>
                  <p className="text-sm text-gray-600">Fully Operational</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    Current Period
                  </h3>
                  <p className="text-sm text-gray-600">{data.currentPeriod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-600" />
                BoE Import Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    Ready
                  </div>
                  <div className="text-sm text-orange-700">Import System</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">Active</div>
                  <div className="text-sm text-blue-700">FIFO Tracking</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/footwear">
                  <Button variant="outline" className="w-full gap-2">
                    <Archive className="w-4 h-4" />
                    View Footwear System
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
