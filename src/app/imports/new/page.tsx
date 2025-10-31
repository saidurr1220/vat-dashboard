"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Calculator } from "lucide-react";

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

export default function NewBOEPage() {
  const [formData, setFormData] = useState<BOEFormData>({
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
  });

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotalCost = () => {
    const assessable = Number(formData.assessableValue) || 0;
    const baseVat = Number(formData.baseVat) || 0;
    const sd = Number(formData.sd) || 0;
    const vat = Number(formData.vat) || 0;
    const at = Number(formData.at) || 0;
    return assessable + baseVat + sd + vat + at;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    try {
      const response = await fetch("/api/imports/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form on success
        setFormData({
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
        });
      }
    } catch (error) {
      console.error("Error saving BOE:", error);
      setResult({
        success: false,
        message: "Failed to save BOE record. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/imports"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Imports
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add Single BoE Record
          </h1>
          <p className="text-gray-600">Enter Bill of Entry details manually</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BoE Number *
                </label>
                <input
                  type="text"
                  name="boeNo"
                  value={formData.boeNo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BOE123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BoE Date *
                </label>
                <input
                  type="date"
                  name="boeDate"
                  value={formData.boeDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Code
                </label>
                <input
                  type="text"
                  name="officeCode"
                  value={formData.officeCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="DHK001"
                />
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Item Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Number *
                </label>
                <input
                  type="text"
                  name="itemNo"
                  value={formData.itemNo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HS Code
                </label>
                <input
                  type="text"
                  name="hsCode"
                  value={formData.hsCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="6403.99.00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="qty"
                  value={formData.qty}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Pair, Pcs, Kg, etc."
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cost Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessable Value (৳)
                </label>
                <input
                  type="number"
                  name="assessableValue"
                  value={formData.assessableValue}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base VAT (৳)
                </label>
                <input
                  type="number"
                  name="baseVat"
                  value={formData.baseVat}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="7500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SD (৳)
                </label>
                <input
                  type="number"
                  name="sd"
                  value={formData.sd}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VAT (৳)
                </label>
                <input
                  type="number"
                  name="vat"
                  value={formData.vat}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="8625"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AT (৳)
                </label>
                <input
                  type="number"
                  name="at"
                  value={formData.at}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Cost (৳)
                  </label>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-semibold text-green-600">
                      ৳{calculateTotalCost().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div
                className={`flex items-center gap-3 ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full ${
                    result.success ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="font-medium">
                  {result.success ? "Success!" : "Error"}
                </span>
              </div>
              <p
                className={`mt-2 ${
                  result.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message}
              </p>
              {result.success && (
                <Link
                  href="/imports"
                  className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  View All Records
                </Link>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link
              href="/imports"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save BoE Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
