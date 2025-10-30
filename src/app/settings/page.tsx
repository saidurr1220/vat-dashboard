"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast-helpers";

interface Settings {
  id: number;
  bin: string;
  taxpayerName: string;
  address: string;
  vatRateDefault: string;
  currency: string;
  testsPerKitDefault: number;
  simpleChalanThreshold: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    bin: "",
    taxpayerName: "",
    address: "",
    vatRateDefault: "0.15",
    currency: "BDT",
    testsPerKitDefault: 120,
    simpleChalanThreshold: "200000",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          bin: data.bin || "",
          taxpayerName: data.taxpayerName || "",
          address: data.address || "",
          vatRateDefault: data.vatRateDefault || "0.15",
          currency: data.currency || "BDT",
          testsPerKitDefault: data.testsPerKitDefault || 120,
          simpleChalanThreshold: data.simpleChalanThreshold || "200000",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        showToast.success("Settings updated successfully!");
      } else {
        const errorData = await response.json();
        showToast.error(`Failed to update settings: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      showToast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Configure system settings and preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Company Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BIN (Business Identification Number) *
              </label>
              <input
                type="text"
                value={formData.bin}
                onChange={(e) =>
                  setFormData({ ...formData, bin: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="004223577-0205"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxpayer Name *
              </label>
              <input
                type="text"
                value={formData.taxpayerName}
                onChange={(e) =>
                  setFormData({ ...formData, taxpayerName: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="M S RAHMAN TRADERS"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="174. Siddique Bazar, Dhaka"
                rows={3}
                required
              />
            </div>
          </div>
        </div>

        {/* VAT Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">VAT Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default VAT Rate
              </label>
              <select
                value={formData.vatRateDefault}
                onChange={(e) =>
                  setFormData({ ...formData, vatRateDefault: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0.15">15% (Standard Rate)</option>
                <option value="0.075">7.5% (Reduced Rate)</option>
                <option value="0.05">5% (Special Rate)</option>
                <option value="0">0% (Zero Rate)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simple Challan Threshold (BDT)
              </label>
              <input
                type="number"
                value={formData.simpleChalanThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    simpleChalanThreshold: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="200000"
              />
            </div>
          </div>
        </div>

        {/* Product Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Product Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BDT">BDT (Bangladeshi Taka)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Tests per Kit (BioShield)
              </label>
              <input
                type="number"
                value={formData.testsPerKitDefault}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    testsPerKitDefault: parseInt(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="120"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">
                Current Tax Period:
              </span>
              <span className="ml-2 text-gray-900">October 2025</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">System Version:</span>
              <span className="ml-2 text-gray-900">1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-900">
                {(settings as any)?.updatedAt
                  ? new Date((settings as any).updatedAt).toLocaleString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
