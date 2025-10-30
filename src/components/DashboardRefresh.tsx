"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function DashboardRefresh() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={refreshing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      {refreshing ? "Refreshing..." : "Refresh"}
    </Button>
  );
}
