"use client";

import { useState } from "react";
import { SimpleBarChart, SimpleDonutChart } from "./simple-chart";

interface InteractiveChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  type: "bar" | "donut";
  height?: number;
  size?: number;
  showValues?: boolean;
  onItemClick?: (item: { label: string; value: number }) => void;
}

export function InteractiveChart({
  data,
  type,
  height = 180,
  size = 140,
  showValues = true,
  onItemClick,
}: InteractiveChartProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemInteraction = (item: { label: string; value: number }) => {
    setSelectedItem(item.label);
    onItemClick?.(item);
  };

  const enhancedData = data.map((item) => ({
    ...item,
    color:
      selectedItem === item.label
        ? "#1d4ed8" // Highlighted color
        : hoveredItem === item.label
        ? "#3b82f6" // Hover color
        : item.color || "#6b7280",
  }));

  return (
    <div className="space-y-4">
      {type === "bar" ? (
        <SimpleBarChart data={enhancedData} height={height} />
      ) : (
        <SimpleDonutChart data={enhancedData} size={size} />
      )}

      {showValues && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {data.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                selectedItem === item.label
                  ? "bg-blue-50 border border-blue-200"
                  : hoveredItem === item.label
                  ? "bg-gray-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleItemInteraction(item)}
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || "#6b7280" }}
                />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {typeof item.value === "number" && item.value > 1000000
                  ? `${(item.value / 1000000).toFixed(1)}M`
                  : item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
}

export function MetricCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  color = "blue",
}: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    red: "bg-red-50 border-red-200 text-red-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <div className={`text-sm font-medium ${trendColors[trend]}`}>
            {trend === "up" && "↗"} {trend === "down" && "↘"}{" "}
            {change > 0 ? "+" : ""}
            {change}%
          </div>
        )}
      </div>
    </div>
  );
}
