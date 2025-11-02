"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Hash,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calculator,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface BOERecord {
  id: number;
  boeNo: string;
  boeDate: string;
  officeCode?: string;
  itemNo: string;
  hsCode?: string;
  description?: string;
  assessableValue?: number;
  baseVat?: number;
  sd?: number;
  vat?: number;
  at?: number;
  qty?: number;
  unit?: string;
}

interface BOEFormData {
  boeNo: string;
  boeDate: string;
  officeCode: string;
  itemNo: string;
  hsCode: string;
  description: string;
  assessableValue: string;
  baseVat: string;
  sd: string;
  vat: string;
  at: string;
  qty: string;
  unit: string;
}

const initialFormData: BOEFormData = {
  boeNo: "",
  boeDate: "",
  officeCode: "",
  itemNo: "",
  hsCode: "",
  description: "",
  assessableValue: "",
  baseVat: "",
  sd: "",
  vat: "",
  at: "",
  qty: "",
  unit: "",
};

export default function ImportsPage() {
  const { showSuccess, showError } = useToast();
  const [importsData, setImportsData] = useState<BOERecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BOERecord | null>(null);
  const [formData, setFormData] = useState<BOEFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchImports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/imports");
      if (response.ok) {
        const data = await response.json();
        setImportsData(data);
      } else {
        showError("Error", "Failed to fetch import records");
      }
    } catch (error) {
      console.error("Error fetching imports:", error);
      showError("Error", "Failed to fetch import records");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchImports();
  }, []);

  const handleInputChange = useCallback(
    (field: keyof BOEFormData, value: string) => {
      console.log(`Input change: ${field} = ${value}`);
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingRecord(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        boeNo: formData.boeNo,
        boeDate: formData.boeDate,
        officeCode: formData.officeCode || null,
        itemNo: formData.itemNo,
        hsCode: formData.hsCode || null,
        description: formData.description || null,
        assessableValue: formData.assessableValue
          ? parseFloat(formData.assessableValue)
          : null,
        baseVat: formData.baseVat ? parseFloat(formData.baseVat) : null,
        sd: formData.sd ? parseFloat(formData.sd) : null,
        vat: formData.vat ? parseFloat(formData.vat) : null,
        at: formData.at ? parseFloat(formData.at) : null,
        qty: formData.qty ? parseFloat(formData.qty) : null,
        unit: formData.unit || null,
      };

      let response;
      if (editingRecord) {
        response = await fetch(`/api/imports/${editingRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        console.log("Manual add payload:", payload);
        response = await fetch("/api/imports/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
      }

      if (response.ok) {
        showSuccess(
          "Success",
          editingRecord
            ? "BOE record updated successfully"
            : "BOE record created successfully"
        );
        resetForm();
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        fetchImports();
      } else {
        const error = await response.json();
        showError("Error", error.error || "Failed to save BOE record");
      }
    } catch (error) {
      console.error("Error saving BOE record:", error);
      showError("Error", "Failed to save BOE record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: BOERecord) => {
    setEditingRecord(record);
    setFormData({
      boeNo: record.boeNo,
      boeDate: record.boeDate.split("T")[0],
      officeCode: record.officeCode || "",
      itemNo: record.itemNo,
      hsCode: record.hsCode || "",
      description: record.description || "",
      assessableValue: record.assessableValue?.toString() || "",
      baseVat: record.baseVat?.toString() || "",
      sd: record.sd?.toString() || "",
      vat: record.vat?.toString() || "",
      at: record.at?.toString() || "",
      qty: record.qty?.toString() || "",
      unit: record.unit || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/imports/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showSuccess("Success", "BOE record deleted successfully");
        fetchImports();
      } else {
        const error = await response.json();
        showError("Error", error.error || "Failed to delete BOE record");
      }
    } catch (error) {
      console.error("Error deleting BOE record:", error);
      showError("Error", "Failed to delete BOE record");
    }
  };

  const filteredData = importsData.filter(
    (record) =>
      record.boeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.hsCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredData.reduce((sum, record) => {
    const assessableValue = Number(record.assessableValue) || 0;
    const baseVat = Number(record.baseVat) || 0;
    const sd = Number(record.sd) || 0;
    const vat = Number(record.vat) || 0;
    const at = Number(record.at) || 0;

    const totalCost =
      Math.round(
        (assessableValue + baseVat + sd + vat + at + Number.EPSILON) * 100
      ) / 100;
    return sum + totalCost;
  }, 0);

  const FormDialog = ({ isEdit = false }: { isEdit?: boolean }) => (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {isEdit ? "Edit BOE Record" : "Add New BOE Record"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the BOE record details below."
            : "Fill in the details to create a new BOE record."}
        </DialogDescription>
      </DialogHeader>

      <form
        key={editingRecord?.id || "new"}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="boeNo">BOE Number *</Label>
            <Input
              id="boeNo"
              value={formData.boeNo}
              onChange={(e) => handleInputChange("boeNo", e.target.value)}
              required
              placeholder="Enter BOE number"
            />
          </div>
          <div>
            <Label htmlFor="boeDate">BOE Date *</Label>
            <Input
              id="boeDate"
              type="date"
              value={formData.boeDate}
              onChange={(e) => handleInputChange("boeDate", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="officeCode">Office Code</Label>
            <Input
              id="officeCode"
              value={formData.officeCode}
              onChange={(e) => handleInputChange("officeCode", e.target.value)}
              placeholder="Office code"
            />
          </div>
        </div>

        {/* Item Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemNo">Item Number *</Label>
            <Input
              id="itemNo"
              value={formData.itemNo}
              onChange={(e) => handleInputChange("itemNo", e.target.value)}
              required
              placeholder="Item number"
            />
          </div>
          <div>
            <Label htmlFor="hsCode">HS Code</Label>
            <Input
              id="hsCode"
              value={formData.hsCode}
              onChange={(e) => handleInputChange("hsCode", e.target.value)}
              placeholder="HS code"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Item description"
            rows={2}
          />
        </div>

        {/* Financial Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="assessableValue">Assessable Value</Label>
            <Input
              id="assessableValue"
              type="number"
              step="0.01"
              value={formData.assessableValue}
              onChange={(e) =>
                handleInputChange("assessableValue", e.target.value)
              }
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="baseVat">Base VAT</Label>
            <Input
              id="baseVat"
              type="number"
              step="0.01"
              value={formData.baseVat}
              onChange={(e) => handleInputChange("baseVat", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="sd">Supplementary Duty</Label>
            <Input
              id="sd"
              type="number"
              step="0.01"
              value={formData.sd}
              onChange={(e) => handleInputChange("sd", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vat">VAT</Label>
            <Input
              id="vat"
              type="number"
              step="0.01"
              value={formData.vat}
              onChange={(e) => handleInputChange("vat", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="at">Advance Tax (AT)</Label>
            <Input
              id="at"
              type="number"
              step="0.01"
              value={formData.at}
              onChange={(e) => handleInputChange("at", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              step="0.01"
              value={formData.qty}
              onChange={(e) => handleInputChange("qty", e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => handleInputChange("unit", e.target.value)}
              placeholder="PCS, KG, etc."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isEdit ? "Update" : "Create"} BOE Record
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Import Management (BOE)
          </h1>
          <p className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4" />
            Bill of Entry records and customs documentation
          </p>
        </div>

        {/* Action Bar */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search BOE records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Button
                  onClick={fetchImports}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add BOE Record
                    </Button>
                  </DialogTrigger>
                  <FormDialog />
                </Dialog>

                <Button variant="outline" asChild>
                  <Link href="/imports/upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Link>
                </Button>

                <Button variant="outline" asChild>
                  <Link href="/api/imports/export">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Total Records
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {filteredData.length}
                  </p>
                  <p className="text-xs text-blue-700">BOE entries</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    ৳
                    {isNaN(totalValue)
                      ? "0.0"
                      : (totalValue / 1000000).toFixed(1)}
                    M
                  </p>
                  <p className="text-xs text-green-700">Import cost</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    VAT Paid
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    ৳
                    {(
                      filteredData.reduce(
                        (sum, r) => sum + (Number(r.vat) || 0),
                        0
                      ) / 1000
                    ).toFixed(0)}
                    K
                  </p>
                  <p className="text-xs text-purple-700">Import VAT</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">AT Paid</p>
                  <p className="text-2xl font-bold text-orange-900">
                    ৳
                    {(
                      filteredData.reduce(
                        (sum, r) => sum + (Number(r.at) || 0),
                        0
                      ) / 1000
                    ).toFixed(0)}
                    K
                  </p>
                  <p className="text-xs text-orange-700">Advance Tax</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import Records Table */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              BOE Records ({filteredData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading records...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No BOE Records Found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? "No records match your search criteria."
                    : "Start by adding your first BOE record."}
                </p>
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First BOE Record
                    </Button>
                  </DialogTrigger>
                  <FormDialog />
                </Dialog>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BOE Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Info
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Financial
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((record) => {
                      const assessableValue =
                        Number(record.assessableValue) || 0;
                      const baseVat = Number(record.baseVat) || 0;
                      const sd = Number(record.sd) || 0;
                      const vat = Number(record.vat) || 0;
                      const at = Number(record.at) || 0;

                      const totalCost =
                        Math.round(
                          (assessableValue +
                            baseVat +
                            sd +
                            vat +
                            at +
                            Number.EPSILON) *
                            100
                        ) / 100;

                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.boeNo}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(record.boeDate).toLocaleDateString(
                                  "en-GB"
                                )}
                              </div>
                              {record.officeCode && (
                                <div className="text-xs text-gray-400">
                                  Office: {record.officeCode}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Item #{record.itemNo}
                              </div>
                              {record.hsCode && (
                                <div className="text-sm text-gray-500">
                                  HS: {record.hsCode}
                                </div>
                              )}
                              {record.description && (
                                <div className="text-xs text-gray-400 max-w-xs truncate">
                                  {record.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {Number(record.qty || 0).toLocaleString()}
                            </div>
                            {record.unit && (
                              <div className="text-xs text-gray-500">
                                {record.unit}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="space-y-1 text-xs">
                              {record.assessableValue && (
                                <div>
                                  Assessable: ৳
                                  {Number(
                                    record.assessableValue
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                              {record.vat && (
                                <div className="text-green-600">
                                  VAT: ৳
                                  {Number(record.vat).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                              {record.at && (
                                <div className="text-orange-600">
                                  AT: ৳
                                  {Number(record.at).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-gray-900">
                              ৳
                              {totalCost.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete BOE Record
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete BOE record{" "}
                                      {record.boeNo}? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(record.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown Info */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Cost Breakdown Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Assessable Value
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  Base import value for duty calculation
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-green-600" />
                  Base VAT
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  Initial VAT amount
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  SD
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  Supplementary Duty
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  VAT
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  Value Added Tax
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-red-600" />
                  AT
                </div>
                <div className="text-gray-600 text-xs mt-1">Advance Tax</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <FormDialog isEdit={true} />
        </Dialog>
      </div>
    </div>
  );
}
