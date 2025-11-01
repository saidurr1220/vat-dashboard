"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FixDatesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const fixDates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sales/fix-dates", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`Success: ${data.message}`);
      } else {
        const error = await response.json();
        setResult(`Error: ${error.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Fix Sales Dates</h1>
        <p className="text-gray-600 mb-6">
          This will update all sales records that have missing dates.
        </p>

        <div className="space-y-4">
          <Button onClick={fixDates} disabled={loading} className="w-full">
            {loading ? "Fixing..." : "Fix Dates"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded ${
                result.startsWith("Success")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {result}
            </div>
          )}

          <Link href="/sales">
            <Button variant="outline" className="w-full">
              Back to Sales
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
