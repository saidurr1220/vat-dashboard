"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { makeAuthenticatedRequest } from "@/lib/auth-client";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  Save,
  Package,
  Calculator,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  FileText,
  ShoppingCart,
  Edit3,
  Trash2,
  User,
  Phone,
  MapPin,
  CreditCard,
  Hash,
  Eye,
  EyeOff,
  Sparkles,
  Wallet,
  BarChart3,
  Clock,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  sellExVat: string;
  stockOnHand: number;
}

interface SaleLine {
  productId: number;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineAmount: number;
}

interface PriceMemory {
  productId: number;
  lastPrice: number;
  lastUsed: string;
}

export default function MonthlyBulkSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    invoiceNo: "",
    amountType: "EXCL" as "INCL" | "EXCL",
    notes: "Monthly bulk cash sales",
  });

  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [qty, setQty] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [priceMemory, setPriceMemory] = useState<PriceMemory[]>([]);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  // UI State
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, nextInvoiceRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/sales/next-invoice"),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }

        if (nextInvoiceRes.ok) {
          const nextInvoiceData = await nextInvoiceRes.json();
          setFormData((prev) => ({
            ...prev,
            invoiceNo: `BULK-${nextInvoiceData.nextInvoiceNo}`,
          }));
        }

        // Load price memory
        try {
          const priceRes = await fetch("/api/price-memory");
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            setPriceMemory(Array.isArray(priceData) ? priceData : []);
          } else {
            console.log("Price memory API error:", priceRes.status);
            setPriceMemory([]);
          }
        } catch (error) {
          console.log("Failed to load price memory:", error);
          setPriceMemory([]);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getLastPrice = (productId: number): number | null => {
    if (!Array.isArray(priceMemory)) return null;
    const memory = priceMemory.find((p) => p.productId === productId);
    return memory ? Number(memory.lastPrice) : null;
  };

  const savePriceMemory = async (productId: number, price: number) => {
    try {
      const response = await fetch("/api/price-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, price }),
      });

      if (!response.ok) {
        console.log("Price memory API returned error:", response.status);
      }
    } catch (error) {
      console.log("Failed to save price memory:", error);
    }
  };

  // Add product to sale lines
  const addSaleLine = () => {
    if (!selectedProductId || qty <= 0) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Determine unit price - use custom price if provided, otherwise use product default
    let unitPrice = Number(product.sellExVat);
    if (useCustomPrice && customPrice) {
      const parsedCustomPrice = parseFloat(customPrice);
      if (isNaN(parsedCustomPrice) || parsedCustomPrice <= 0) {
        alert("Please enter a valid custom price");
        return;
      }
      unitPrice = parsedCustomPrice;
    }

    // Check if product already exists in sale lines
    const existingLineIndex = saleLines.findIndex(
      (line) => line.productId === selectedProductId
    );

    if (existingLineIndex >= 0) {
      // Update existing line - use the new price if different
      const updatedLines = [...saleLines];
      updatedLines[existingLineIndex].qty += qty;
      // Update price if it's different from existing
      if (updatedLines[existingLineIndex].unitPrice !== unitPrice) {
        updatedLines[existingLineIndex].unitPrice = unitPrice;
      }
      updatedLines[existingLineIndex].lineAmount =
        updatedLines[existingLineIndex].qty *
        updatedLines[existingLineIndex].unitPrice;
      setSaleLines(updatedLines);
    } else {
      // Add new line
      const lineAmount = qty * unitPrice;

      const newLine: SaleLine = {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        qty,
        unitPrice,
        lineAmount,
      };

      setSaleLines([...saleLines, newLine]);
    }

    // Save price memory
    savePriceMemory(selectedProductId, unitPrice);

    setSelectedProductId(null);
    setQty(1);
    setCustomPrice("");
    setUseCustomPrice(false);
  };

  // Remove sale line
  const removeSaleLine = (index: number) => {
    setSaleLines(saleLines.filter((_, i) => i !== index));
  };

  // Inline editing functions
  const startEditItem = (index: number) => {
    const item = saleLines[index];
    setEditingItem(index);
    setEditQty(item.qty);
    setEditPrice(item.unitPrice.toString());
  };

  const saveEditItem = () => {
    if (editingItem === null) return;

    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid unit price");
      return;
    }

    const updatedLines = [...saleLines];
    updatedLines[editingItem].qty = editQty;
    updatedLines[editingItem].unitPrice = price;
    updatedLines[editingItem].lineAmount = editQty * price;
    setSaleLines(updatedLines);

    // Save price memory
    savePriceMemory(updatedLines[editingItem].productId, parseFloat(editPrice));

    setEditingItem(null);
  };

  const cancelEditItem = () => {
    setEditingItem(null);
  };

  // Calculate totals - for monthly bulk sale, just show line totals
  // VAT will be calculated properly on server side when saving
  const subtotal = saleLines.reduce((sum, line, index) => {
    let lineAmount = Number(line.lineAmount || 0);

    // If this line is being edited, use the live calculation
    if (editingItem === index) {
      const price = parseFloat(editPrice || "0");
      lineAmount = editQty * (isNaN(price) ? 0 : price);
    }

    return sum + lineAmount;
  }, 0);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleLines.length === 0) {
      alert("Please add at least one product to the monthly sale");
      return;
    }

    if (!formData.month || !formData.invoiceNo) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Use last day of the month as sale date
      const [year, month] = formData.month.split("-");
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0);

      const response = await makeAuthenticatedRequest("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: lastDayOfMonth.toISOString().split("T")[0],
          invoiceNo: formData.invoiceNo,
          customer: `Monthly Cash Sales - ${new Date(
            parseInt(year),
            parseInt(month) - 1
          ).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          customerId: null, // No specific customer for bulk sales
          amountType: formData.amountType,
          notes: formData.notes,
          lines: saleLines.map((line) => ({
            productId: line.productId,
            qty: line.qty,
            unitPrice: line.unitPrice,
            lineAmount: line.lineAmount,
            unit: line.unit,
          })),
          isMonthlyBulk: true, // Flag to identify monthly bulk sales
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/sales/${result.saleId}`);
      } else {
        const errorData = await response.json();
        console.error("Monthly sale creation error:", errorData);
        alert(
          `Failed to create monthly sale: ${errorData.error}${
            errorData.details ? "\nDetails: " + errorData.details : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error creating monthly sale:", error);
      alert("Failed to create monthly sale");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading Bulk Sale
                </h3>
                <p className="text-gray-600">
                  Please wait while we prepare the form...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Modern Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Monthly Bulk Sale
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Create bulk invoice for monthly cash sales tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Bulk Sales Entry
                </Badge>
                <Link href="/sales">
                  <Button variant="outline" className="gap-2">
                    ← Back to Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Sale Information */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">
                      Monthly Sale Information
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="month"
                        className="text-sm font-semibold flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Month *
                      </Label>
                      <Input
                        id="month"
                        type="month"
                        value={formData.month}
                        onChange={(e) =>
                          setFormData({ ...formData, month: e.target.value })
                        }
                        className="border-2 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="invoiceNo"
                        className="text-sm font-semibold flex items-center gap-2"
                      >
                        <Hash className="w-4 h-4" />
                        Invoice No *
                      </Label>
                      <Input
                        id="invoiceNo"
                        value={formData.invoiceNo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            invoiceNo: e.target.value,
                          })
                        }
                        placeholder="Bulk invoice number"
                        className="border-2 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Amount Type</Label>
                    <Select
                      value={formData.amountType}
                      onValueChange={(value: "INCL" | "EXCL") =>
                        setFormData({ ...formData, amountType: value })
                      }
                    >
                      <SelectTrigger className="border-2 focus:border-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXCL">VAT Exclusive</SelectItem>
                        <SelectItem value="INCL">VAT Inclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="notes"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Notes
                    </Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Additional notes for this monthly bulk sale"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Add Products */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">Add Products</CardTitle>
                        {useCustomPrice && (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700 border-orange-200"
                          >
                            Custom Pricing
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPriceHistory(!showPriceHistory)}
                      className="gap-2"
                    >
                      {showPriceHistory ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Price Memory
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Select Product
                      </Label>
                      <Select
                        value={selectedProductId?.toString() || ""}
                        onValueChange={(value) =>
                          setSelectedProductId(Number(value) || null)
                        }
                      >
                        <SelectTrigger className="border-2 focus:border-emerald-500">
                          <SelectValue placeholder="Choose a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{product.name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {product.stockOnHand} {product.unit}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qty" className="text-sm font-semibold">
                        Quantity
                        {selectedProductId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Stock:{" "}
                            {products.find((p) => p.id === selectedProductId)
                              ?.stockOnHand || 0}
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="qty"
                        type="number"
                        min="1"
                        max={
                          selectedProductId
                            ? products.find((p) => p.id === selectedProductId)
                                ?.stockOnHand || 999
                            : 999
                        }
                        value={qty}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          const maxStock = selectedProductId
                            ? products.find((p) => p.id === selectedProductId)
                                ?.stockOnHand || 999
                            : 999;
                          if (value > maxStock) {
                            alert(
                              `Warning: Quantity (${value}) exceeds available stock (${maxStock})`
                            );
                          }
                          setQty(value);
                        }}
                        placeholder="Enter quantity"
                        className="border-2 focus:border-emerald-500"
                      />
                    </div>

                    {/* Price Input Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          Unit Price
                        </Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="useCustomPrice"
                            checked={useCustomPrice}
                            onChange={(e) => {
                              setUseCustomPrice(e.target.checked);
                              if (!e.target.checked) {
                                setCustomPrice("");
                              }
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <Label
                            htmlFor="useCustomPrice"
                            className="text-xs text-gray-600"
                          >
                            Custom Price
                          </Label>
                        </div>
                      </div>

                      {useCustomPrice ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              ৳
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              placeholder="Enter custom price"
                              className="border-2 focus:border-emerald-500 pl-8"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Default price: ৳
                            {selectedProductId
                              ? Number(
                                  products.find(
                                    (p) => p.id === selectedProductId
                                  )?.sellExVat || 0
                                ).toLocaleString()
                              : "0"}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Default Price:
                            </span>
                            <span className="font-semibold text-gray-900">
                              ৳
                              {selectedProductId
                                ? Number(
                                    products.find(
                                      (p) => p.id === selectedProductId
                                    )?.sellExVat || 0
                                  ).toLocaleString()
                                : "0"}
                            </span>
                          </div>
                          {selectedProductId &&
                            getLastPrice(selectedProductId) && (
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200">
                                <span className="text-xs text-emerald-600">
                                  Last Used:
                                </span>
                                <span className="text-xs font-medium text-emerald-700">
                                  ৳
                                  {Number(
                                    getLastPrice(selectedProductId) || 0
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {selectedProductId && qty > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                            Line Total:
                            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full animate-pulse">
                              Live
                            </span>
                          </span>
                          <span className="text-lg font-bold text-emerald-900 transition-all duration-300">
                            ৳
                            {(() => {
                              let unitPrice = Number(
                                products.find((p) => p.id === selectedProductId)
                                  ?.sellExVat || 0
                              );
                              if (useCustomPrice && customPrice) {
                                const parsedCustomPrice =
                                  parseFloat(customPrice);
                                if (
                                  !isNaN(parsedCustomPrice) &&
                                  parsedCustomPrice > 0
                                ) {
                                  unitPrice = parsedCustomPrice;
                                }
                              }
                              return (qty * unitPrice).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                            })()}
                          </span>
                        </div>
                        {useCustomPrice && customPrice && (
                          <div className="mt-2 pt-2 border-t border-emerald-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-emerald-700">
                                Custom Price:
                              </span>
                              <span className="font-medium text-emerald-800">
                                ৳
                                {parseFloat(customPrice || "0").toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}{" "}
                                per unit
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={addSaleLine}
                      disabled={
                        !selectedProductId ||
                        qty <= 0 ||
                        (useCustomPrice &&
                          (!customPrice || parseFloat(customPrice) <= 0))
                      }
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </Button>
                  </div>

                  {showPriceHistory &&
                    Array.isArray(priceMemory) &&
                    priceMemory.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Recent Price Memory
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {priceMemory.slice(0, 5).map((memory) => {
                            const product = products.find(
                              (p) => p.id === memory.productId
                            );
                            return (
                              <div
                                key={memory.productId}
                                className="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
                              >
                                <span className="font-medium">
                                  {product?.name || "Unknown Product"}
                                </span>
                                <span className="text-emerald-600 font-bold">
                                  ৳
                                  {Number(
                                    memory.lastPrice || 0
                                  ).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>

            {/* Sale Lines */}
            {saleLines.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle className="text-xl">
                        Monthly Sale Items
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="gap-2">
                      <Package className="w-3 h-3" />
                      {saleLines.length} item{saleLines.length > 1 ? "s" : ""}{" "}
                      added
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Line Amount
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {saleLines.map((line, index) => (
                          <tr
                            key={index}
                            className="hover:bg-purple-50/50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {line.productName}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <Badge variant="outline">{line.unit}</Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {editingItem === index ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={editQty}
                                  onChange={(e) =>
                                    setEditQty(parseInt(e.target.value))
                                  }
                                  className="w-20 text-center"
                                />
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="font-bold"
                                >
                                  {line.qty}
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {editingItem === index ? (
                                <div className="flex items-center justify-end">
                                  <span className="text-gray-500 mr-1">৳</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) =>
                                      setEditPrice(e.target.value)
                                    }
                                    className="w-24 text-right"
                                  />
                                </div>
                              ) : (
                                <span className="font-semibold">
                                  ৳
                                  {line.unitPrice.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {editingItem === index ? (
                                <div className="text-right">
                                  <span className="text-lg font-bold text-blue-600">
                                    ৳
                                    {(() => {
                                      const price = parseFloat(
                                        editPrice || "0"
                                      );
                                      const total =
                                        editQty * (isNaN(price) ? 0 : price);
                                      return total.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      });
                                    })()}
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Live Preview
                                  </div>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-emerald-600">
                                  ৳
                                  {(
                                    Number(line.lineAmount) || 0
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {editingItem === index ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={saveEditItem}
                                      className="bg-green-600 hover:bg-green-700 gap-1"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditItem}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEditItem(index)}
                                      className="gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => removeSaleLine(index)}
                                      className="gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Remove
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Enhanced Totals */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t p-6">
                    <div className="flex justify-end">
                      <div className="w-96 space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span className="flex items-center gap-2">
                            Line Total:
                            {editingItem !== null && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                Live Update
                              </span>
                            )}
                          </span>
                          <span className="text-lg">
                            ৳
                            {subtotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-blue-700 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              Final VAT calculation will be done when saving.
                              This is just the sum of line amounts.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Link href="/sales">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting || saleLines.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Monthly Sale...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Monthly Sale
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
