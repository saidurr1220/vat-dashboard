"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/auth-client";
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
  LogOut,
  User,
  Download,
  Database,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Monthly Bulk Sale", href: "/sales/monthly", icon: Wallet },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products & Stock", href: "/products", icon: Package },
  {
    name: "Stock-Import Check",
    href: "/products/stock-import-mismatch",
    icon: FileText,
  },
  { name: "Footwear System", href: "/footwear", icon: Package },
  { name: "Treasury", href: "/treasury", icon: Banknote },
  {
    name: "VAT Register 6.1",
    href: "/reports/vat-register-6-1",
    icon: FileText,
  },
  {
    name: "Sale Register 6.2",
    href: "/reports/sale-register-6-2",
    icon: BarChart3,
  },
  {
    name: "Mushok 6.10 (>2L)",
    href: "/reports/mushok-6-10",
    icon: Scale,
  },
  { name: "Comprehensive Reports", href: "/vat/reports", icon: Download },
  { name: "Monthly VAT", href: "/vat/monthly", icon: Calculator },
  { name: "Backup & Restore", href: "/admin/backup", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function ModernNavigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check if user is logged in
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log("Not authenticated");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    // Listen for auth changes (when user logs in/out)
    const handleAuthChange = () => {
      checkAuth();
    };

    // Listen for storage events (when auth state changes in other tabs)
    window.addEventListener("storage", handleAuthChange);

    // Custom event for auth state changes
    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  // Re-check auth when pathname changes (after login redirect)
  useEffect(() => {
    if (mounted) {
      async function recheckAuth() {
        try {
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          setUser(null);
        }
      }
      recheckAuth();
    }
  }, [pathname, mounted]);

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

          {/* User Section & Footer */}
          <div className="px-6 py-4 space-y-3">
            {/* User Info & Logout */}
            {user && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-accent/50 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full justify-start text-xs"
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  Logout
                </Button>
              </div>
            )}

            {!user && !isLoading && (
              <div className="space-y-2">
                <Link href="/admin/login">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs"
                  >
                    <User className="h-3 w-3 mr-2" />
                    Login
                  </Button>
                </Link>
              </div>
            )}

            <Separator />

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
