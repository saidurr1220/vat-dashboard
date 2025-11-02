"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { makeAuthenticatedRequest } from "@/lib/auth-client";
import AuthGuard from "@/components/AuthGuard";
import { ModernCard, ModernCardHeader } from "@/components/ui/modern-card";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput, ModernSelect } from "@/components/ui/modern-input";
import { Package, ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewProductPage() {
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    hsCode: "",
    category: "",
    unit: "",
    costExVat: "",
    sellExVat: "",
    testsPerKit: "",
  });

  const categoryOptions = [
    { value: "Footwear", label: "Footwear", icon: "👟" },
    { value: "Fan", label: "Fan", icon: "🌀" },
    { value: "BioShield", label: "BioShield", icon: "🛡️" },
    { value: "Instrument", label: "Instrument", icon: "🔧" },
    { value: "Appliance Parts", label: "Appliance Parts", icon: "⚙️" },
    { value: "Reagent", label: "Reagent", icon: "🧪" },
  ];

  const unitOptions = [
    { value: "PC", label: "Piece (PC)" },
    { value: "PAIR", label: "Pair" },
    { value: "KG", label: "Kilogram (KG)" },
    { value: "LITER", label: "Liter" },
    { value: "METER", label: "Meter" },
    { value: "PC (TEST)", label: "Test Kit" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.unit.trim()) {
      showError("Missing Information", "Please fill in required fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await makeAuthenticatedRequest("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          testsPerKit: formData.testsPerKit
            ? parseInt(formData.testsPerKit)
            : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess(
          "Product Created",
          "Product has been created successfully!"
        );
        router.push(`/products/${result.id}`);
      } else {
        const errorData = await response.json();
        showError(
          "Creation Failed",
          errorData.error || "Failed to create product"
        );
      }
    } catch (error) {
      console.error("Error creating product:", error);
      showError("Creation Failed", "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Create New Product
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Add a new product to your inventory
                  </p>
                </div>
              </div>
              <Link href="/products">
                <ModernButton variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Products
                </ModernButton>
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ModernCard>
              <ModernCardHeader
                title="Product Information"
                subtitle="Basic product details"
                icon={<Package className="w-5 h-5" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="Product Name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(value) =>
                    setFormData({ ...formData, name: value })
                  }
                  required
                />

                <ModernInput
                  label="SKU"
                  placeholder="Product SKU (optional)"
                  value={formData.sku}
                  onChange={(value) => setFormData({ ...formData, sku: value })}
                />

                <ModernInput
                  label="HS Code"
                  placeholder="Harmonized System Code"
                  value={formData.hsCode}
                  onChange={(value) =>
                    setFormData({ ...formData, hsCode: value })
                  }
                />

                <ModernSelect
                  label="Category"
                  placeholder="Select category"
                  value={formData.category}
                  onChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  options={categoryOptions}
                />

                <ModernSelect
                  label="Unit"
                  placeholder="Select unit"
                  value={formData.unit}
                  onChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                  options={unitOptions}
                  required
                />

                <ModernInput
                  label="Tests Per Kit"
                  placeholder="For BioShield products"
                  type="number"
                  value={formData.testsPerKit}
                  onChange={(value) =>
                    setFormData({ ...formData, testsPerKit: value })
                  }
                  min="1"
                />
              </div>
            </ModernCard>

            <ModernCard>
              <ModernCardHeader
                title="Pricing Information"
                subtitle="Cost and selling prices (excluding VAT)"
                icon={<Package className="w-5 h-5" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="Cost Price (Ex VAT)"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="৳"
                  value={formData.costExVat}
                  onChange={(value) =>
                    setFormData({ ...formData, costExVat: value })
                  }
                />

                <ModernInput
                  label="Selling Price (Ex VAT)"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="৳"
                  value={formData.sellExVat}
                  onChange={(value) =>
                    setFormData({ ...formData, sellExVat: value })
                  }
                />
              </div>

              {formData.costExVat && formData.sellExVat && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Price Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Profit Margin:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        {formData.costExVat && formData.sellExVat
                          ? (
                              ((parseFloat(formData.sellExVat) -
                                parseFloat(formData.costExVat)) /
                                parseFloat(formData.costExVat)) *
                              100
                            ).toFixed(2)
                          : "0"}
                        %
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Selling + VAT:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        ৳
                        {formData.sellExVat
                          ? (parseFloat(formData.sellExVat) * 1.15).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </ModernCard>

            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Link href="/products">
                <ModernButton variant="secondary">Cancel</ModernButton>
              </Link>
              <ModernButton
                type="submit"
                loading={submitting}
                variant="primary"
              >
                Create Product
              </ModernButton>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
