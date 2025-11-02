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
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  stockOnHand: number;
  sellExVat: string;
  costExVat: string;
  unit: string;
}

interface Customer {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  bin?: string;
  nid?: string;
}

interface SaleItem {
  productId: number;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface CompanySettings {
  bin: string;
  taxpayerName: string;
  address: string;
  vatRateDefault: number;
  currency: string;
}

interface PriceMemory {
  productId: number;
  lastPrice: number;
  lastUsed: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sale form state
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNo, setInvoiceNo] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [customer, setCustomer] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBin, setCustomerBin] = useState("");
  const [customerNid, setCustomerNid] = useState("");
  const [amountType, setAmountType] = useState<"INCL" | "EXCL">("EXCL");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  // Add item form - Enhanced
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [priceMemory, setPriceMemory] = useState<PriceMemory[]>([]);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  // UI State
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchCompanySettings();
    generateInvoiceNo();
    loadPriceMemory();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        const availableProducts = data.filter(
          (p: Product) => p.stockOnHand > 0
        );
        setProducts(availableProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setCompanySettings({
          bin: data.bin,
          taxpayerName: data.taxpayer_name,
          address: data.address,
          vatRateDefault: data.vat_rate_default || 15,
          currency: data.currency || "BDT",
        });
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNo = async () => {
    try {
      const response = await fetch("/api/sales/next-invoice");
      if (response.ok) {
        const data = await response.json();
        setInvoiceNo(data.nextInvoiceNo);
      }
    } catch (error) {
      console.error("Error generating invoice number:", error);
    }
  };

  const loadPriceMemory = async () => {
    try {
      const response = await fetch("/api/price-memory");
      if (response.ok) {
        const data = await response.json();
        setPriceMemory(Array.isArray(data) ? data : []);
      } else {
        console.log("Price memory API error:", response.status);
        setPriceMemory([]);
      }
    } catch (error) {
      console.log("No price memory found:", error);
      setPriceMemory([]);
    }
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

  const getLastPrice = (productId: number): number | null => {
    if (!Array.isArray(priceMemory)) return null;
    const memory = priceMemory.find((p) => p.productId === productId);
    return memory ? Number(memory.lastPrice) : null;
  };

  const handleProductSelect = async (productId: string) => {
    const id = parseInt(productId);
    setSelectedProductId(id);

    if (id) {
      const product = products.find((p) => p.id === id);
      if (product) {
        if (!useCustomPrice) {
          // Try to get last used price first
          const lastPrice = getLastPrice(id);
          if (lastPrice) {
            setUnitPrice(lastPrice.toString());
          } else {
            setUnitPrice(product.sellExVat);
          }
        }
        // If using custom price, keep the current unitPrice value
      }
    }
  };

  const addSaleItem = () => {
    if (!selectedProductId || qty <= 0 || !unitPrice) {
      alert("Please fill all fields");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid unit price");
      return;
    }

    const lineAmount = qty * price;

    // Check if product already exists
    const existingIndex = saleItems.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingIndex >= 0) {
      // Update existing item - use the new price if different
      const updatedItems = [...saleItems];
      updatedItems[existingIndex].qty += qty;
      // Update price if it's different from existing
      if (updatedItems[existingIndex].unitPrice !== price) {
        updatedItems[existingIndex].unitPrice = price;
      }
      updatedItems[existingIndex].lineTotal =
        updatedItems[existingIndex].qty * updatedItems[existingIndex].unitPrice;
      setSaleItems(updatedItems);
    } else {
      // Add new item
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        qty,
        unitPrice: price,
        lineTotal: lineAmount,
      };
      setSaleItems([...saleItems, newItem]);
    }

    // Save price memory
    savePriceMemory(selectedProductId, price);

    // Reset form
    setSelectedProductId(null);
    setQty(1);
    setUnitPrice("");
    setUseCustomPrice(false);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const startEditItem = (index: number) => {
    const item = saleItems[index];
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

    const updatedItems = [...saleItems];
    updatedItems[editingItem].qty = editQty;
    updatedItems[editingItem].unitPrice = price;
    updatedItems[editingItem].lineTotal = editQty * price;
    setSaleItems(updatedItems);

    // Save price memory
    savePriceMemory(updatedItems[editingItem].productId, parseFloat(editPrice));

    setEditingItem(null);
  };

  const cancelEditItem = () => {
    setEditingItem(null);
  };

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item, index) => {
      let lineTotal = Number(item.lineTotal) || 0;

      // If this item is being edited, use the live calculation
      if (editingItem === index) {
        const price = parseFloat(editPrice || "0");
        lineTotal = editQty * (isNaN(price) ? 0 : price);
      }

      return sum + lineTotal;
    }, 0);

    let vatAmount = 0;
    let totalAmount = 0;
    let netAmount = 0;

    if (amountType === "INCL") {
      totalAmount = subtotal; // subtotal is gross (includes VAT)
      vatAmount = (subtotal * 15) / 115;
      netAmount = subtotal - vatAmount;
    } else {
      netAmount = subtotal; // subtotal is net (excludes VAT)
      vatAmount = subtotal * 0.15;
      totalAmount = subtotal + vatAmount; // store gross amount
    }

    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      vatAmount: isNaN(vatAmount) ? 0 : vatAmount,
      totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
      netAmount: isNaN(netAmount) ? 0 : netAmount,
    };
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "new") {
      setSelectedCustomerId(null);
      setCustomer("");
      setCustomerAddress("");
      setCustomerPhone("");
      setCustomerBin("");
      setCustomerNid("");
    } else if (customerId) {
      const selectedCustomer = customers.find(
        (c) => c.id === parseInt(customerId)
      );
      if (selectedCustomer) {
        setSelectedCustomerId(selectedCustomer.id);
        setCustomer(selectedCustomer.name);
        setCustomerAddress(selectedCustomer.address || "");
        setCustomerPhone(selectedCustomer.phone || "");
        setCustomerBin(selectedCustomer.bin || "");
        setCustomerNid(selectedCustomer.nid || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleItems.length === 0) {
      alert("Please add at least one product to the sale");
      return;
    }

    if (!customer.trim()) {
      alert("Please select a customer");
      return;
    }

    setSaving(true);

    try {
      const totals = calculateTotals();

      const salesData = {
        date: saleDate,
        invoiceNo: invoiceNo,
        customer: customer,
        customerId: selectedCustomerId,
        amountType: amountType,
        grandTotal: totals.totalAmount,
        notes:
          customerAddress || customerPhone || customerBin || customerNid
            ? `Address: ${customerAddress}, Phone: ${customerPhone}, BIN: ${customerBin}, NID: ${customerNid}`
            : "",
        customerInfo:
          customerPhone || customerAddress || customerBin || customerNid
            ? {
                name: customer,
                phone: customerPhone || null,
                address: customerAddress || null,
                bin: customerBin || null,
                nid: customerNid || null,
              }
            : null,
        lines: saleItems.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineAmount: item.lineTotal,
          unit: item.unit,
        })),
      };

      const response = await makeAuthenticatedRequest("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salesData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/sales/${result.saleId}`);
      } else {
        const errorData = await response.json();
        console.error("Sale creation error:", errorData);
        alert(
          `Failed to create sale: ${errorData.error}${
            errorData.details ? "\nDetails: " + errorData.details : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Failed to create sale");
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading Sales Entry
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Modern Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Create New Sale
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Modern sales interface with smart features
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  New Sales Entry
                </Badge>
                <Link href="/sales">
                  <Button variant="outline" className="gap-2">
                    ← Back to Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Company Information Card */}
          {companySettings && (
            <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">Seller Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-700 mb-1">
                      Company Name
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {companySettings.taxpayerName}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm font-semibold text-green-700 mb-1">
                      BIN Number
                    </p>
                    <p className="text-lg font-bold text-green-900 font-mono">
                      {companySettings.bin}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm font-semibold text-purple-700 mb-1">
                      Address
                    </p>
                    <p className="text-sm font-medium text-purple-900">
                      {companySettings.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sale Information */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Sale Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="saleDate"
                        className="text-sm font-semibold flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Sale Date *
                      </Label>
                      <Input
                        id="saleDate"
                        type="date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="border-2 focus:border-orange-500"
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
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        placeholder="Invoice number"
                        className="border-2 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Select Customer
                      </Label>
                      <Select
                        value={selectedCustomerId?.toString() || "new"}
                        onValueChange={handleCustomerChange}
                      >
                        <SelectTrigger className="border-2 focus:border-orange-500">
                          <SelectValue placeholder="Choose existing customer or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">
                            + Create New Customer
                          </SelectItem>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name}{" "}
                              {customer.phone && `(${customer.phone})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="customer"
                        className="text-sm font-semibold"
                      >
                        Customer Name *
                      </Label>
                      <Input
                        id="customer"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        placeholder="Customer name"
                        className="border-2 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="customerPhone"
                        className="text-sm font-semibold flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Phone (Optional)
                      </Label>
                      <Input
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone number"
                        className="border-2 focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="customerBin"
                        className="text-sm font-semibold flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        BIN (Optional)
                      </Label>
                      <Input
                        id="customerBin"
                        value={customerBin}
                        onChange={(e) => setCustomerBin(e.target.value)}
                        placeholder="Business Identification Number"
                        className="border-2 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="customerAddress"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Address (Optional)
                    </Label>
                    <textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Customer address"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Amount Type</Label>
                    <Select
                      value={amountType}
                      onValueChange={(value: "INCL" | "EXCL") =>
                        setAmountType(value)
                      }
                    >
                      <SelectTrigger className="border-2 focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXCL">VAT Exclusive</SelectItem>
                        <SelectItem value="INCL">VAT Inclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Add Products */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
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
                        onValueChange={handleProductSelect}
                      >
                        <SelectTrigger className="border-2 focus:border-green-500">
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
                        className="border-2 focus:border-green-500"
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
                              if (!e.target.checked && selectedProductId) {
                                // Reset to default/last price when unchecking
                                const product = products.find(
                                  (p) => p.id === selectedProductId
                                );
                                if (product) {
                                  const lastPrice =
                                    getLastPrice(selectedProductId);
                                  if (lastPrice) {
                                    setUnitPrice(lastPrice.toString());
                                  } else {
                                    setUnitPrice(product.sellExVat);
                                  }
                                }
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
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
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                              ৳
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={unitPrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (
                                  value === "" ||
                                  (!isNaN(parseFloat(value)) &&
                                    parseFloat(value) >= 0)
                                ) {
                                  setUnitPrice(value);
                                }
                              }}
                              placeholder="Enter custom price"
                              className="border-2 focus:border-green-500 pl-8"
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
                              {selectedProductId &&
                              getLastPrice(selectedProductId)
                                ? "Last Used Price:"
                                : "Default Price:"}
                            </span>
                            <span className="font-semibold text-gray-900">
                              ৳
                              {unitPrice
                                ? Number(unitPrice).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "0.00"}
                            </span>
                          </div>
                          {selectedProductId &&
                            getLastPrice(selectedProductId) && (
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200">
                                <span className="text-xs text-gray-500">
                                  Default:
                                </span>
                                <span className="text-xs font-medium text-gray-600">
                                  ৳
                                  {Number(
                                    products.find(
                                      (p) => p.id === selectedProductId
                                    )?.sellExVat || 0
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {selectedProductId && unitPrice && qty > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800 flex items-center gap-2">
                            Line Total:
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full animate-pulse">
                              Live
                            </span>
                          </span>
                          <span className="text-lg font-bold text-green-900 transition-all duration-300">
                            ৳
                            {(() => {
                              const price = parseFloat(unitPrice || "0");
                              const total = qty * (isNaN(price) ? 0 : price);
                              return total.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                            })()}
                          </span>
                        </div>
                        {useCustomPrice && unitPrice && (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-700">
                                Custom Price:
                              </span>
                              <span className="font-medium text-green-800">
                                ৳
                                {parseFloat(unitPrice || "0").toLocaleString(
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
                      onClick={addSaleItem}
                      disabled={
                        !selectedProductId ||
                        qty <= 0 ||
                        !unitPrice ||
                        (useCustomPrice &&
                          (!unitPrice || parseFloat(unitPrice) <= 0))
                      }
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
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
                                <span className="text-green-600 font-bold">
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

            {/* Sale Items */}
            {saleItems.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle className="text-xl">Sale Items</CardTitle>
                    </div>
                    <Badge variant="secondary" className="gap-2">
                      <Package className="w-3 h-3" />
                      {saleItems.length} item{saleItems.length > 1 ? "s" : ""}
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
                            Line Total
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {saleItems.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-blue-50/50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {item.productName}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <Badge variant="outline">{item.unit}</Badge>
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
                                  {item.qty}
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
                                  {item.unitPrice.toLocaleString("en-US", {
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
                                <span className="text-lg font-bold text-green-600">
                                  ৳
                                  {(Number(item.lineTotal) || 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
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
                                      onClick={() => removeSaleItem(index)}
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
                            {amountType === "EXCL"
                              ? "Net Amount (Ex-VAT):"
                              : "Subtotal:"}
                            {editingItem !== null && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Live Update
                              </span>
                            )}
                          </span>
                          <span className="text-lg">
                            ৳
                            {totals.subtotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                          <span className="text-orange-700 font-medium">
                            VAT (15%){" "}
                            {amountType === "INCL" ? "- Included" : "- Added"}:
                          </span>
                          <span className="font-bold text-orange-700 text-lg">
                            ৳
                            {totals.vatAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        {amountType === "INCL" && (
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span>Net Amount (Ex-VAT):</span>
                            <span className="text-lg">
                              ৳
                              {totals.netAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        <div className="border-t-2 border-gray-300 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              Grand Total (Inc VAT):
                              {editingItem !== null && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Updating Live
                                </span>
                              )}
                            </span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              ৳
                              {totals.totalAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
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
                disabled={saving || saleItems.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Sale...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Sale
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
