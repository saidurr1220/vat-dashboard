"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  RotateCcw,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Download,
  BarChart3,
  Calculator,
  TrendingUp,
  DollarSign,
  Layers,
  Filter,
  Eye,
  Sparkles,
  Building2,
  Archive,
} from "lucide-react";

interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  createdProducts?: number;
  errors?: string[];
}

interface VATSummary {
  totalStock: number;
  totalValue: number;
  totalVAT: number;
  totalWithVAT: number;
  productCount: number;
}

interface ProductGroup {
  name: string;
  count: number;
  totalStock: number;
  totalValue: number;
  products: FootwearProduct[];
}

interface FootwearProduct {
  id: number;
  name: string;
  hsCode: string;
  stockOnHand: number;
  sellExVat: number;
  costExVat: number;
  category: string;
  unit: string;
}

export default function FootwearManagementPage() {
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [resetResult, setResetResult] = useState<any>(null);

  // Data states
  const [vatSummary, setVatSummary] = useState<VATSummary | null>(null);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [products, setProducts] = useState<FootwearProduct[]>([]);

  // Filter states
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "value">("name");

  useEffect(() => {
    loadFootwearData();
  }, []);

  const loadFootwearData = async () => {
    try {
      const [productsRes, summaryRes] = await Promise.all([
        fetch("/api/products?category=Footwear"),
        fetch("/api/footwear/summary"),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
        generateProductGroups(productsData);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setVatSummary(summaryData);
      } else {
        // Calculate summary from products if API doesn't exist
        calculateVATSummary(products);
      }
    } catch (error) {
      console.error("Error loading footwear data:", error);
      // Fallback calculation
      calculateVATSummary(products);
    } finally {
      setLoading(false);
    }
  };

  const calculateVATSummary = (productList: FootwearProduct[]) => {
    const footwearProducts = productList.filter(
      (p) => p.category === "Footwear"
    );
    const totalStock = footwearProducts.reduce(
      (sum, p) => sum + p.stockOnHand,
      0
    );
    const totalValue = footwearProducts.reduce(
      (sum, p) => sum + p.stockOnHand * p.sellExVat,
      0
    );
    const totalVAT = totalValue * 0.15;
    const totalWithVAT = totalValue + totalVAT;

    setVatSummary({
      totalStock,
      totalValue,
      totalVAT,
      totalWithVAT,
      productCount: footwearProducts.length,
    });
  };

  const generateProductGroups = (productList: FootwearProduct[]) => {
    const footwearProducts = productList.filter(
      (p) => p.category === "Footwear"
    );
    const groups: { [key: string]: FootwearProduct[] } = {};

    // Group by product name prefix (first 3 words)
    footwearProducts.forEach((product) => {
      const groupName = product.name.split(" ").slice(0, 3).join(" ");
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(product);
    });

    const groupArray = Object.entries(groups).map(([name, products]) => ({
      name,
      count: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stockOnHand, 0),
      totalValue: products.reduce(
        (sum, p) => sum + p.stockOnHand * p.sellExVat,
        0
      ),
      products,
    }));

    setProductGroups(groupArray.sort((a, b) => b.totalValue - a.totalValue));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/footwear/boe/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        // Reload data after successful import
        await loadFootwearData();
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        message: "Failed to import file",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Are you sure you want to reset all footwear data? This action cannot be undone."
      )
    ) {
      return;
    }

    setResetting(true);
    setResetResult(null);

    try {
      const response = await fetch("/api/footwear/reset", {
        method: "POST",
      });

      const result = await response.json();
      setResetResult(result);

      if (result.success) {
        // Reload data after successful reset
        await loadFootwearData();
      }
    } catch (error) {
      console.error("Reset error:", error);
      setResetResult({
        success: false,
        message: "Failed to reset data",
      });
    } finally {
      setResetting(false);
    }
  };

  const filteredProducts = products
    .filter((p) => p.category === "Footwear")
    .filter((p) => {
      if (selectedGroup === "all") return true;
      const groupName = p.name.split(" ").slice(0, 3).join(" ");
      return groupName === selectedGroup;
    })
    .filter(
      (p) =>
        searchTerm === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.hsCode.includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "stock":
          return b.stockOnHand - a.stockOnHand;
        case "value":
          return b.stockOnHand * b.sellExVat - a.stockOnHand * a.sellExVat;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading Footwear System
                </h3>
                <p className="text-gray-600">
                  Please wait while we load footwear data...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Footwear System
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Advanced footwear inventory with VAT management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200"
              >
                <Archive className="mr-2 h-4 w-4" />
                Footwear Management
              </Badge>
            </div>
          </div>
        </div>

        {/* VAT Summary Cards */}
        {vatSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Total Stock
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {vatSummary.totalStock.toLocaleString()} Pairs
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Stock Value (Ex-VAT)
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ৳{vatSummary.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">
                      VAT Amount (15%)
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      ৳{vatSummary.totalVAT.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">
                      Total Value (Inc VAT)
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      ৳{vatSummary.totalWithVAT.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="groups">Product Groups</TabsTrigger>
            <TabsTrigger value="products">All Products</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Product Groups Summary */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">Top Product Groups</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productGroups.slice(0, 5).map((group, index) => (
                    <div
                      key={group.name}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {group.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {group.count} products • {group.totalStock} pairs
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ৳{group.totalValue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Stock Value</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            {/* Product Groups */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Product Groups</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {productGroups.length} groups
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productGroups.map((group) => (
                    <Card
                      key={group.name}
                      className="border border-gray-200 hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 truncate">
                              {group.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {group.count} products
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Stock:</span>
                              <span className="font-medium">
                                {group.totalStock} pairs
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Value:</span>
                              <span className="font-bold text-green-600">
                                ৳{group.totalValue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedGroup(group.name);
                              // Switch to products tab
                              const productsTab = document.querySelector(
                                '[value="products"]'
                              ) as HTMLElement;
                              productsTab?.click();
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Products
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Filters */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">Filter Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Search Products</Label>
                    <Input
                      placeholder="Search by name or HS code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Group</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {productGroups.map((group) => (
                          <SelectItem key={group.name} value={group.name}>
                            {group.name} ({group.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select
                      value={sortBy}
                      onValueChange={(value: "name" | "stock" | "value") =>
                        setSortBy(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="stock">Stock Quantity</SelectItem>
                        <SelectItem value="value">Stock Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Footwear Products</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {filteredProducts.length} products
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          HS Code
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Stock Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-orange-50/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{product.hsCode}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold">
                              {product.stockOnHand} {product.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold">
                              ৳{product.sellExVat.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-green-600">
                              ৳
                              {(
                                product.stockOnHand * product.sellExVat
                              ).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            {/* Import/Export Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Import BOE Data</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="file-upload"
                      className="text-sm font-medium"
                    >
                      Select Excel File
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={importing}
                      className="mt-2"
                    />
                  </div>

                  {importing && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Importing data...</span>
                    </div>
                  )}

                  {importResult && (
                    <div
                      className={`p-4 rounded-lg border ${
                        importResult.success
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {importResult.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                        <span className="font-medium">
                          {importResult.message}
                        </span>
                      </div>
                      {importResult.imported && (
                        <p className="mt-2 text-sm">
                          Imported: {importResult.imported} records
                          {importResult.createdProducts &&
                            ` • Created: ${importResult.createdProducts} products`}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Reset Data</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="mt-2 text-sm text-yellow-700">
                      This will permanently delete all footwear data including
                      BOE lots and products. This action cannot be undone.
                    </p>
                  </div>

                  <Button
                    onClick={handleReset}
                    disabled={resetting}
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Reset All Data
                      </>
                    )}
                  </Button>

                  {resetResult && (
                    <div
                      className={`p-4 rounded-lg border ${
                        resetResult.success
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {resetResult.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                        <span className="font-medium">
                          {resetResult.message}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
