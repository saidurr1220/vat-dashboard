"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Banknote,
  TrendingUp,
  Settings,
  Scale,
  Menu,
  X,
  Calendar,
  Calculator,
  Wallet,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Sales", href: "/sales", icon: ShoppingCart },

  { name: "Monthly Bulk Sale", href: "/sales/monthly", icon: Wallet },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products & Stock", href: "/products", icon: Package },
  { name: "Footwear System", href: "/footwear", icon: Package },
  { name: "Imports (BoE)", href: "/imports", icon: FileText },
  { name: "Treasury", href: "/treasury", icon: Banknote },
  { name: "VAT Reports", href: "/vat", icon: TrendingUp },
  { name: "VAT Management", href: "/vat/manage", icon: Scale },
  { name: "Monthly VAT", href: "/vat/monthly", icon: Calculator },
  { name: "Closing Balance", href: "/vat/closing-balance", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function ModernNavigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50 print:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 print:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border shadow-lg transform transition-transform duration-200 ease-in-out print:hidden",
          "lg:translate-x-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center px-6 py-6 border-b border-border">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    VAT Dashboard
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    M S RAHMAN TRADERS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              // Simple exact match logic - only highlight the exact current page
              const isActive = mounted && pathname === item.href;

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-4 w-4 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                Oct 2025
              </Badge>
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">BIN: 004223577-0205</p>
              <p>Tax Period: October 2025</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
