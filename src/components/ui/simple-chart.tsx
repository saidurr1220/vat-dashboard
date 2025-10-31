"use client";

import { cn } from "@/lib/utils";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: ChartData[];
  height?: number;
  className?: string;
}

export function SimpleBarChart({
  data,
  height = 200,
  className,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;

          return (
            <div key={item.label} className="flex flex-col items-center flex-1">
              <div className="flex flex-col items-center justify-end h-full">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {item.value.toLocaleString()}
                </div>
                <div
                  className="w-full rounded-t-md transition-all duration-500 ease-out"
                  style={{
                    height: barHeight,
                    backgroundColor: color,
                    minHeight: "4px",
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SimpleDonutChartProps {
  data: ChartData[];
  size?: number;
  className?: string;
}

export function SimpleDonutChart({
  data,
  size = 120,
  className,
}: SimpleDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const radius = size / 2 - 10;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={normalizedRadius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${
              (percentage / 100) * circumference
            } ${circumference}`;
            const strokeDashoffset =
              (-cumulativePercentage * circumference) / 100;
            const color =
              item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;

            cumulativePercentage += percentage;

            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={normalizedRadius}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item, index) => {
          const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
          const percentage = ((item.value / total) * 100).toFixed(1);

          return (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="text-sm">
                <span className="font-medium text-gray-900">{item.label}</span>
                <span className="text-gray-500 ml-1">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
