"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Save } from "lucide-react";
import Link from "next/link";

export default function FixSaleDatePage() {
  const [saleId, setSaleId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/sales/fix-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleId: parseInt(saleId),
          newDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✅ Sale date updated successfully!");
        setSaleId("");
        setNewDate("");
      } else {
        setMessage("❌ " + data.error);
      }
    } catch (error) {
      setMessage("❌ Failed to update sale date");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/sales" className="text-blue-600 hover:underline">
          ← Back to Sales
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Fix Sale Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="saleId">Sale ID</Label>
              <Input
                id="saleId"
                type="number"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
                required
                placeholder="Enter sale ID"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can find the sale ID in the URL when viewing a sale
              </p>
            </div>

            <div>
              <Label htmlFor="newDate">New Date</Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("✅")
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Updating..." : "Update Sale Date"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> For Invoice 20251002, the sale ID is likely
              2 or you can check by clicking on the sale in the sales list.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
