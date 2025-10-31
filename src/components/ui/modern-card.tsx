import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ModernCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function ModernCard({
  children,
  className,
  hover = false,
  padding = "md",
}: ModernCardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm",
        hover &&
          "hover:shadow-md hover:border-gray-300/50 transition-all duration-200",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ModernCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function ModernCardHeader({
  title,
  subtitle,
  icon,
  action,
}: ModernCardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
