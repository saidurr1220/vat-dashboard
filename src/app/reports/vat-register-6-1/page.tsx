"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  FileText,
  Plus,
  Download,
  X,
  Edit,
  Trash2,
  Upload,
  Calendar,
} from "lucide-react";

interface PurchaseRecord {
  id: number;
  boe_no: string;
  boe_date: string;
  office_code: string;
  item_no: string;
  description: string;
  hs_code: string;
  qty: number;
  unit: string;
  assessable_value: number;
  base_vat: number;
  sd: number;
  vat: number;
  at: number;
  total_value: number;
}

export default function VATRegister61Page() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    (currentDate.getMonth() + 1).toString().padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString()
  );

  const monthName = new Date(
    parseInt(selectedYear),
    parseInt(selectedMonth) - 1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const [formData, setFormData] = useState({
    boeNo: "",
    boeDate: "",
    officeCode: "",
    itemNo: "",
    hsCode: "",
    description: "",
    qty: "",
    unit: "",
    assessableValue: "",
    baseVat: "",
    sd: "",
    vat: "",
    at: "",
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reports/vat-register-6-1?month=${selectedMonth}&year=${selectedYear}`
      );
      const result = await response.json();
      setPurchases(result.purchases || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveImport(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/imports/${editingId}`
        : "/api/imports/single";
      const method = editingId ? "PUT" : "POST";

      console.log("Saving import:", { url, method, formData });

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log("Save response:", result);

      if (response.ok) {
        alert(
          editingId
            ? "Import updated successfully!"
            : "Import added successfully!"
        );
        setShowAddForm(false);
        setEditingId(null);
        resetForm();
        loadData();
      } else {
        alert(
          `Failed to save import: ${result.error || "Unknown error"}\n${
            result.details || ""
          }`
        );
      }
    } catch (error) {
      console.error("Error saving import:", error);
      alert(
        `Error saving import: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setFormData({
      boeNo: "",
      boeDate: "",
      officeCode: "",
      itemNo: "",
      hsCode: "",
      description: "",
      qty: "",
      unit: "",
      assessableValue: "",
      baseVat: "",
      sd: "",
      vat: "",
      at: "",
    });
  }

  function handleEdit(item: PurchaseRecord) {
    console.log("Editing item:", item);

    setEditingId(item.id);

    const formValues = {
      boeNo: item.boe_no,
      boeDate: new Date(item.boe_date).toISOString().split("T")[0],
      officeCode: item.office_code || "",
      itemNo: item.item_no || "",
      hsCode: item.hs_code || "",
      description: item.description || "",
      qty: item.qty?.toString() || "",
      unit: item.unit || "",
      assessableValue: item.assessable_value?.toString() || "",
      baseVat: item.base_vat?.toString() || "",
      sd: item.sd?.toString() || "",
      vat: item.vat?.toString() || "",
      at: item.at?.toString() || "",
    };

    console.log("Form values:", formValues);
    setFormData(formValues);
    setShowAddForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm("এই import record মুছে ফেলবেন?")) {
      return;
    }

    try {
      console.log("Deleting import ID:", id);

      const response = await fetch(`/api/imports/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      console.log("Delete response:", result);

      if (response.ok) {
        alert("Import deleted successfully!");
        loadData();
      } else {
        alert(
          `Failed to delete import: ${result.error || "Unknown error"}\n${
            result.details || ""
          }`
        );
      }
    } catch (error) {
      console.error("Error deleting import:", error);
      alert(
        `Error deleting import: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async function exportToPDF() {
    try {
      const { generateMushok61PDF } = await import("@/lib/pdf-generator");

      const pdfData = {
        purchases: purchases,
        period: {
          month: selectedMonth,
          year: selectedYear,
        },
        settings: {
          bin: "004223577-0205",
          taxpayerName: "M S RAHMAN TRADERS",
          address: "Dhaka, Bangladesh",
        },
      };

      const pdf = generateMushok61PDF(pdfData);
      pdf.save(`Mushok_6.1_${selectedYear}_${selectedMonth}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF");
    }
  }

  function downloadCSVTemplate() {
    const headers = [
      "BOE Number",
      "BOE Date (YYYY-MM-DD)",
      "Office Code",
      "Item No",
      "HS Code",
      "Description",
      "Quantity",
      "Unit",
      "Assessable Value",
      "Base VAT",
      "SD",
      "VAT",
      "AT",
    ];

    const sampleRow = [
      "C-123456",
      "2025-11-01",
      "CGP",
      "1",
      "6405.90.00",
      "LADIES KEDS",
      "1000",
      "PAIR",
      "100000",
      "15000",
      "0",
      "15000",
      "5000",
    ];

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "boe_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/imports/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Successfully imported ${result.imported} records!`);
        loadData();
      } else {
        alert(`Error: ${result.error || "Failed to import CSV"}`);
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      alert("Error uploading CSV file");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totals = purchases.reduce(
    (acc, item) => ({
      assessableValue: acc.assessableValue + Number(item.assessable_value || 0),
      baseVat: acc.baseVat + Number(item.base_vat || 0),
      sd: acc.sd + Number(item.sd || 0),
      vat: acc.vat + Number(item.vat || 0),
      at: acc.at + Number(item.at || 0),
      totalValue: acc.totalValue + Number(item.total_value || 0),
    }),
    { assessableValue: 0, baseVat: 0, sd: 0, vat: 0, at: 0, totalValue: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto space-y-6">
        <div className="text-center mb-8 print:mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            মূসক ৬.১ - ক্রয় রেজিস্টার
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Purchase Register (Imports) - {monthName}
          </p>
        </div>

        {/* Month/Year Selector */}
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <Label className="text-sm font-medium text-gray-700">
                    Month:
                  </Label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Year:
                  </Label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[0, 1, 2, 3, 4].map((i) => {
                      const year = (currentDate.getFullYear() - i).toString();
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Import
                </Button>
                <Button onClick={downloadCSVTemplate} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  CSV Template
                </Button>
                <Button
                  variant="outline"
                  disabled={uploading}
                  asChild={!uploading}
                >
                  <label className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                      disabled={uploading}
                    />
                  </label>
                </Button>
                <Button onClick={exportToPDF} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {showAddForm && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {editingId ? "Edit Import (BOE)" : "Add New Import (BOE)"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSaveImport}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <Label>BOE Number *</Label>
                  <Input
                    required
                    value={formData.boeNo}
                    onChange={(e) =>
                      setFormData({ ...formData, boeNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>BOE Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.boeDate}
                    onChange={(e) =>
                      setFormData({ ...formData, boeDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Office Code</Label>
                  <Input
                    value={formData.officeCode}
                    onChange={(e) =>
                      setFormData({ ...formData, officeCode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Item No *</Label>
                  <Input
                    required
                    value={formData.itemNo}
                    onChange={(e) =>
                      setFormData({ ...formData, itemNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>HS Code</Label>
                  <Input
                    value={formData.hsCode}
                    onChange={(e) =>
                      setFormData({ ...formData, hsCode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Input
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.qty}
                    onChange={(e) =>
                      setFormData({ ...formData, qty: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Assessable Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.assessableValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessableValue: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Base VAT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.baseVat}
                    onChange={(e) =>
                      setFormData({ ...formData, baseVat: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>SD</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sd}
                    onChange={(e) =>
                      setFormData({ ...formData, sd: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>VAT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.vat}
                    onChange={(e) =>
                      setFormData({ ...formData, vat: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>AT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.at}
                    onChange={(e) =>
                      setFormData({ ...formData, at: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-3 flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {editingId ? "Update" : "Save"} Import
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="print:p-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 print:hidden" />
              আমদানি ক্রয় (BOE Records) - {purchases.length} entries
            </CardTitle>
          </CardHeader>
          <CardContent className="print:p-2">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      ক্রমিক
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      BOE নং
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      তারিখ
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      অফিস
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      পণ্যের বিবরণ
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      HS Code
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                      পরিমাণ
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                      মূল্য
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                      Base VAT
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                      SD
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                      VAT
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                      AT
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                      মোট
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium text-gray-500">
                          এই মাসে কোন আমদানি নেই
                        </p>
                      </td>
                    </tr>
                  ) : (
                    purchases.map((item, index) => (
                      <tr
                        key={`purchase-${item.id}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-2 py-1 text-gray-900">{index + 1}</td>
                        <td className="px-2 py-1 text-gray-900">
                          {item.boe_no}
                        </td>
                        <td className="px-2 py-1 text-gray-600">
                          {new Date(item.boe_date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-2 py-1 text-gray-600">
                          {item.office_code}
                        </td>
                        <td className="px-2 py-1 text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-2 py-1 text-gray-600">
                          {item.hs_code}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-900">
                          {Number(item.qty).toFixed(2)} {item.unit}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-900">
                          {Number(item.assessable_value).toLocaleString(
                            "en-IN"
                          )}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-600">
                          {Number(item.base_vat).toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-600">
                          {Number(item.sd).toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-1 text-right text-green-600 font-medium">
                          {Number(item.vat).toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-600">
                          {Number(item.at).toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-900 font-medium">
                          {Number(item.total_value).toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-1 text-center print:hidden">
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {purchases.length > 0 && (
                    <tr className="bg-blue-50 font-bold">
                      <td
                        colSpan={7}
                        className="px-2 py-2 text-right text-gray-900"
                      >
                        মোট:
                      </td>
                      <td className="px-2 py-2 text-right text-gray-900">
                        ৳{totals.assessableValue.toLocaleString("en-IN")}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-900">
                        ৳{totals.baseVat.toLocaleString("en-IN")}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-900">
                        ৳{totals.sd.toLocaleString("en-IN")}
                      </td>
                      <td className="px-2 py-2 text-right text-green-700">
                        ৳{totals.vat.toLocaleString("en-IN")}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-900">
                        ৳{totals.at.toLocaleString("en-IN")}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-900">
                        ৳{totals.totalValue.toLocaleString("en-IN")}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
