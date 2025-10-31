"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModernLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ModernLayout({ children, className }: ModernLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30",
        className
      )}
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
