"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, RefreshCw, Zap } from "lucide-react";

export default function DashboardHeader() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Business Dashboard
            </h1>
            <p className="text-gray-600 text-sm">M S RAHMAN TRADERS</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 text-xs">
            <Calendar className="w-3 h-3" />
            November 2025
          </Badge>
          <Badge className="gap-2 bg-green-600 text-xs">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 hover:bg-blue-50"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
