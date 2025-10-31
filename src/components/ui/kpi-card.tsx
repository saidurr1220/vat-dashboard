"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: "blue" | "green" | "purple" | "orange" | "red" | "gray";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "blue",
  size = "md",
  className,
}: KPICardProps) {
  const colorClasses = {
    blue: {
      bg: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      icon: "from-blue-500 to-blue-600",
      text: "text-blue-900",
      subtitle: "text-blue-700",
    },
    green: {
      bg: "from-green-50 to-green-100",
      border: "border-green-200",
      icon: "from-green-500 to-green-600",
      text: "text-green-900",
      subtitle: "text-green-700",
    },
    purple: {
      bg: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      icon: "from-purple-500 to-purple-600",
      text: "text-purple-900",
      subtitle: "text-purple-700",
    },
    orange: {
      bg: "from-orange-50 to-orange-100",
      border: "border-orange-200",
      icon: "from-orange-500 to-orange-600",
      text: "text-orange-900",
      subtitle: "text-orange-700",
    },
    red: {
      bg: "from-red-50 to-red-100",
      border: "border-red-200",
      icon: "from-red-500 to-red-600",
      text: "text-red-900",
      subtitle: "text-red-700",
    },
    gray: {
      bg: "from-gray-50 to-gray-100",
      border: "border-gray-200",
      icon: "from-gray-500 to-gray-600",
      text: "text-gray-900",
      subtitle: "text-gray-700",
    },
  };

  const sizeClasses = {
    sm: {
      container: "p-4",
      icon: "w-8 h-8",
      iconContainer: "w-10 h-10",
      title: "text-xs",
      value: "text-lg",
      subtitle: "text-xs",
    },
    md: {
      container: "p-5",
      icon: "w-5 h-5",
      iconContainer: "w-12 h-12",
      title: "text-sm",
      value: "text-2xl",
      subtitle: "text-xs",
    },
    lg: {
      container: "p-6",
      icon: "w-6 h-6",
      iconContainer: "w-14 h-14",
      title: "text-base",
      value: "text-3xl",
      subtitle: "text-sm",
    },
  };

  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-600";
    if (trend.value < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-br rounded-xl border backdrop-blur-sm",
        "hover:shadow-md transition-all duration-200 cursor-pointer",
        "animate-in fade-in-0 duration-300",
        colors.bg,
        colors.border,
        sizes.container,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn("font-medium", colors.subtitle, sizes.title)}>
            {title}
          </p>
          <p className={cn("font-bold mt-1", colors.text, sizes.value)}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={cn("mt-1", colors.subtitle, sizes.subtitle)}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2",
                getTrendColor(),
                sizes.subtitle
              )}
            >
              {getTrendIcon()}
              <span className="font-medium">
                {trend.value > 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "bg-gradient-to-br rounded-xl flex items-center justify-center text-white flex-shrink-0",
            colors.icon,
            sizes.iconContainer
          )}
        >
          <div className={sizes.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
