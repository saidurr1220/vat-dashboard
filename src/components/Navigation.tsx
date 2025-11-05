"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: "📊" },
  { name: "Sales", href: "/sales", icon: "💰" },
  { name: "Customers", href: "/customers", icon: "👥" },
  { name: "Products & Stock", href: "/products", icon: "📦" },
  { name: "Treasury", href: "/treasury", icon: "🏦" },
  { name: "VAT Register 6.1", href: "/reports/vat-register-6-1", icon: "📄" },
  {
    name: "Stock-Import Mismatch",
    href: "/products/stock-import-mismatch",
    icon: "⚖️",
  },
  { name: "Sale Register 6.2", href: "/reports/sale-register-6-2", icon: "📋" },
  { name: "Mushok 6.10 (>2L)", href: "/reports/mushok-6-10", icon: "⚖️" },
  { name: "Stock Register", href: "/reports/stock-register", icon: "📦" },
  { name: "VAT Reports", href: "/vat", icon: "📈" },
  { name: "VAT Management", href: "/vat/manage", icon: "⚖️" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">VAT Dashboard</h1>
            <p className="text-xs text-gray-600">M S RAHMAN TRADERS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            // Only calculate active state after component is mounted to prevent hydration mismatch
            const isActive =
              mounted &&
              (pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href)));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>BIN: 004223577-0205</p>
            <p>Tax Period: Oct 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
