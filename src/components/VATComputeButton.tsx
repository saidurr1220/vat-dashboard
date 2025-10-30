"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckCircle, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast-helpers";

export default function VATComputeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleComputeVAT = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/vat/compute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: 2025,
          month: 10,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compute VAT");
      }

      const data = await response.json();
      setResult(data);

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error computing VAT:", error);
      showToast.error("Error computing VAT. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end space-y-3">
      <Button
        onClick={handleComputeVAT}
        disabled={isLoading}
        size="lg"
        className="shadow-md"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Computing...
          </>
        ) : (
          <>
            <Calculator className="mr-2 h-4 w-4" />
            Compute VAT for Oct 2025
          </>
        )}
      </Button>

      {result && (
        <Card className="w-80 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-800">
                VAT Computation Complete!
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">VAT Payable:</span>
                <Badge variant="destructive">
                  ৳{Number(result.vatPayable).toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">
                  Used from Balance:
                </span>
                <Badge variant="secondary">
                  ৳{Number(result.usedFromClosingBalance).toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Treasury Needed:</span>
                <Badge variant="outline">
                  ৳{Number(result.treasuryNeeded).toLocaleString()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
