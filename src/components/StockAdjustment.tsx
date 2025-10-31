"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockAdjustmentProps {
  productId: number;
  productName: string;
  currentStock: number;
  onAdjustmentComplete: () => void;
}

export default function StockAdjustment({
  productId,
  productName,
  currentStock,
  onAdjustmentComplete,
}: StockAdjustmentProps) {
  const { showSuccess, showError } = useToast();
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || !reason) {
      showError("Missing Information", "Please fill in quantity and reason");
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      showError("Invalid Quantity", "Quantity must be greater than 0");
      return;
    }

    if (adjustmentType === "OUT" && qty > currentStock) {
      showError(
        "Insufficient Stock",
        `Cannot adjust out more than current stock (${currentStock})`
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          adjustmentType,
          quantity: qty,
          reason,
          notes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess(
          "Stock Adjusted",
          `Stock ${
            adjustmentType === "IN" ? "increased" : "decreased"
          } by ${qty}. New stock: ${result.newStock}`
        );

        // Reset form
        setQuantity("");
        setReason("");
        setNotes("");

        // Notify parent component
        onAdjustmentComplete();
      } else {
        const errorData = await response.json();
        showError(
          "Adjustment Failed",
          errorData.error || "Failed to adjust stock"
        );
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      showError("Adjustment Failed", "Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Manual Stock Adjustment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adjust stock for: <strong>{productName}</strong> (Current:{" "}
          {currentStock})
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select
                value={adjustmentType}
                onValueChange={(value: "IN" | "OUT") =>
                  setAdjustmentType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      Stock In (Add)
                    </div>
                  </SelectItem>
                  <SelectItem value="OUT">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Stock Out (Remove)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAMAGED">Damaged/Defective</SelectItem>
                <SelectItem value="LOST">Lost/Missing</SelectItem>
                <SelectItem value="FOUND">Found/Recovered</SelectItem>
                <SelectItem value="RECOUNT">
                  Physical Count Adjustment
                </SelectItem>
                <SelectItem value="RETURN">Customer Return</SelectItem>
                <SelectItem value="TRANSFER">Transfer In/Out</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this adjustment"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting
                ? "Adjusting..."
                : `Adjust Stock ${adjustmentType === "IN" ? "In" : "Out"}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
