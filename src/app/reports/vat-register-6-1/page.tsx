"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  ShoppingCart,
  TrendingUp,
  Calculator,
  Loader2,
} from "lucide-react";

export default function VATRegister61Page() {
  const [activeTab, setActiveTab] = useState("partA");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const displayMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const displayYear = currentDate.getFullYear().toString();
  const monthName = new Date(
    parseInt(displayYear),
    parseInt(displayMonth) - 1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/reports/vat-register-6-1?month=${displayMonth}&year=${displayYear}`
        );
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [displayMonth, displayYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center">Error loading data</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">VAT Register 6.1</h1>
          <p className="text-gray-600 mt-2">
            Purchase & Sales Register - {monthName}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="partA">Part A: Purchases</TabsTrigger>
            <TabsTrigger value="partB">Part B: Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="partA">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Register</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Purchases: {data.purchases?.length || 0}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partB">
            <Card>
              <CardHeader>
                <CardTitle>Sales Register</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Sales: {data.sales?.length || 0}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
