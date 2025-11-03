"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Calculator, CheckCircle } from "lucide-react";

export default function AddBOEPage() {
  const [formData, setFormData] = useState({
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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages when user starts typing
    if (error) setError("");
    if (success) setSuccess(false);
  };

  const calculateTotal = () => {
    const assessable = parseFloat(formData.assessableValue) || 0;
    const baseVat = parseFloat(formData.baseVat) || 0;
    const sd = parseFloat(formData.sd) || 0;
    const vat = parseFloat(formData.vat) || 0;
    const at = parseFloat(formData.at) || 0;
    return assessable + baseVat + sd + vat + at;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/imports/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Reset form
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
      } else {
        setError(data.message || "Failed to save BOE record");
      }
    } catch (err) {
      setError("Failed to save BOE record. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/imports"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Imports
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Add BOE Record</h1>
          <p className="text-gray-600 mt-2">
            Enter Bill of Entry details manually
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">BOE record saved successfully!</p>
                <p className="text-sm text-green-700 mt-1">
                  You can add another record or{" "}
                  <Link
                    href="/imports"
                    className="underline hover:no-underline"
                  >
                    view all records
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="boeNo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  BOE Number *
                </label>
                <input
                  type="text"
                  id="boeNo"
                  name="boeNo"
                  value={formData.boeNo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BOE123456"
                />
              </div>
              <div>
                <label
                  htmlFor="boeDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  BOE Date *
                </label>
                <input
                  type="date"
                  id="boeDate"
                  name="boeDate"
                  value={formData.boeDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="officeCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Office Code
                </label>
                <input
                  type="text"
                  id="officeCode"
                  name="officeCode"
                  value={formData.officeCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="DHK001"
                />
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Item Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="itemNo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Item Number *
                </label>
                <input
                  type="text"
                  id="itemNo"
                  name="itemNo"
                  value={formData.itemNo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>
              <div>
                <label
                  htmlFor="hsCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  HS Code
                </label>
                <input
                  type="text"
                  id="hsCode"
                  name="hsCode"
                  value={formData.hsCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="6403.99.00"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <label
                  htmlFor="qty"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Quantity
                </label>
                <input
                  type="number"
                  id="qty"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
              </div>
              <div>
                <label
                  htmlFor="unit"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Unit
                </label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Pair, Pcs, Kg"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Financial Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="assessableValue"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Assessable Value (৳)
                </label>
                <input
                  type="number"
                  id="assessableValue"
                  name="assessableValue"
                  value={formData.assessableValue}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000.00"
                />
              </div>
              <div>
                <label
                  htmlFor="baseVat"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Base VAT (৳)
                </label>
                <input
                  type="number"
                  id="baseVat"
                  name="baseVat"
                  value={formData.baseVat}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="7500.00"
                />
              </div>
              <div>
                <label
                  htmlFor="sd"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Supplementary Duty (৳)
                </label>
                <input
                  type="number"
                  id="sd"
                  name="sd"
                  value={formData.sd}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label
                  htmlFor="vat"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  VAT (৳)
                </label>
                <input
                  type="number"
                  id="vat"
                  name="vat"
                  value={formData.vat}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="8625.00"
                />
              </div>
              <div>
                <label
                  htmlFor="at"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Advance Tax (৳)
                </label>
                <input
                  type="number"
                  id="at"
                  name="at"
                  value={formData.at}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Cost (৳)
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <span className="text-xl font-bold text-green-700">
                      ৳
                      {calculateTotal().toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              href="/imports"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save BOE Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
