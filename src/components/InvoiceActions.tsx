"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface InvoiceActionsProps {
  saleId: number;
  invoiceNo: string;
}

export default function InvoiceActions({
  saleId,
  invoiceNo,
}: InvoiceActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete invoice ${invoiceNo}? This will restore the stock and cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        showSuccess(
          "Invoice Deleted",
          "Invoice deleted and stock restored successfully!"
        );
        router.push("/sales");
      } else {
        const error = await response.json();
        showError("Delete Failed", error.error || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError(
        "Delete Failed",
        "Network error occurred while deleting invoice"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href="/sales">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sales
        </Link>
      </Button>
      <Button onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Print Invoice
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
