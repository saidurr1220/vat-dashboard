"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { KPICardSkeleton } from "@/components/ui/loading-skeleton";
import { ModernCard, ModernCardHeader } from "@/components/ui/modern-card";
import { SimpleBarChart, SimpleDonutChart } from "@/components/ui/simple-chart";
import {
  Package,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalSalesCount: number;
  monthlySales: number;
  monthlySalesCount: number;
  categories: Array<{ category: string; count: number }>;
}

export default function DashboardKPIs() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch basic stats from a lightweight API
        const [productsRes, salesRes] = await Promise.all([
          fetch("/api/products?summary=true"),
          fetch("/api/sales?summary=true"),
        ]);

        const products = productsRes.ok ? await productsRes.json() : [];
        const sales = salesRes.ok ? await salesRes.json() : [];

        // Calculate stats client-side
        const totalProducts = Array.isArray(products) ? products.length : 0;
        const categories = Array.isArray(products)
          ? products.reduce((acc: any, p: any) => {
              const cat = p.category || "General";
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {})
          : {};

        const categoryArray = Object.entries(categories).map(
          ([category, count]) => ({
            category,
            count: count as number,
          })
        );

        const totalSales = Array.isArray(sales)
          ? sales.reduce(
              (sum: number, s: any) => sum + Number(s.totalValue || 0),
              0
            )
          : 0;

        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthlySalesData = Array.isArray(sales)
          ? sales.filter((s: any) => {
              const saleDate = new Date(s.dt);
              return (
                saleDate.getMonth() + 1 === currentMonth &&
                saleDate.getFullYear() === currentYear
              );
            })
          : [];

        const monthlySales = monthlySalesData.reduce(
          (sum: number, s: any) => sum + Number(s.totalValue || 0),
          0
        );

        setStats({
          totalProducts,
          totalSales,
          totalSalesCount: Array.isArray(sales) ? sales.length : 0,
          monthlySales,
          monthlySalesCount: monthlySalesData.length,
          categories: categoryArray,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        // Set default values on error
        setStats({
          totalProducts: 0,
          totalSales: 0,
          totalSalesCount: 0,
          monthlySales: 0,
          monthlySalesCount: 0,
          categories: [],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <>
        {/* KPI Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>

        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare chart data
  const categoryChartData = stats.categories.map((cat, index) => ({
    label: cat.category,
    value: cat.count,
    color: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"][
      index % 6
    ],
  }));

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="Active inventory items"
          icon={<Package className="w-5 h-5" />}
          color="blue"
          size="md"
        />

        <KPICard
          title="Total Sales"
          value={`৳${stats.totalSales.toLocaleString()}`}
          subtitle={`${stats.totalSalesCount} transactions`}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
          size="md"
        />

        <KPICard
          title="This Month"
          value={`৳${stats.monthlySales.toLocaleString()}`}
          subtitle={`${stats.monthlySalesCount} sales`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
          size="md"
        />

        <KPICard
          title="Categories"
          value={stats.categories.length}
          subtitle="Product categories"
          icon={<Activity className="w-5 h-5" />}
          color="orange"
          size="md"
        />
      </div>

      {/* Charts Section */}
      {categoryChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ModernCard>
            <ModernCardHeader
              title="Category Distribution"
              subtitle="Products by category"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <SimpleDonutChart data={categoryChartData} size={140} />
          </ModernCard>

          <ModernCard>
            <ModernCardHeader
              title="Category Overview"
              subtitle="Product count by category"
              icon={<Package className="w-5 h-5" />}
            />
            <SimpleBarChart data={categoryChartData} height={180} />
          </ModernCard>
        </div>
      )}
    </>
  );
}
