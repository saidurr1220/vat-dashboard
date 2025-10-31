"use client";

import { useState, useEffect } from "react";
import { ModernCard, ModernCardHeader } from "@/components/ui/modern-card";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput, ModernSelect } from "@/components/ui/modern-input";
import { KPICard } from "@/components/ui/kpi-card";
import {
  Settings as SettingsIcon,
  Building2,
  Calculator,
  Package,
  Info,
  Save,
  RefreshCw,
} from "lucide-react";
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
  createdAt?: string;
  updatedAt?: string;
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

  const vatRateOptions = [
    { value: "0.15", label: "15% (Standard Rate)" },
    { value: "0.075", label: "7.5% (Reduced Rate)" },
    { value: "0.05", label: "5% (Special Rate)" },
    { value: "0", label: "0% (Zero Rate)" },
  ];

  const currencyOptions = [
    { value: "BDT", label: "BDT (Bangladeshi Taka)" },
    { value: "USD", label: "USD (US Dollar)" },
    { value: "EUR", label: "EUR (Euro)" },
  ];

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm">
                Configure system settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Settings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="VAT Rate"
            value={`${(parseFloat(formData.vatRateDefault) * 100).toFixed(1)}%`}
            subtitle="Current default rate"
            icon={<Calculator className="w-5 h-5" />}
            color="blue"
            size="sm"
          />

          <KPICard
            title="Currency"
            value={formData.currency}
            subtitle="System currency"
            icon={<Package className="w-5 h-5" />}
            color="green"
            size="sm"
          />

          <KPICard
            title="Tests/Kit"
            value={formData.testsPerKitDefault}
            subtitle="Default for BioShield"
            icon={<Package className="w-5 h-5" />}
            color="purple"
            size="sm"
          />

          <KPICard
            title="Challan Limit"
            value={`৳${parseInt(
              formData.simpleChalanThreshold
            ).toLocaleString()}`}
            subtitle="Simple challan threshold"
            icon={<Calculator className="w-5 h-5" />}
            color="orange"
            size="sm"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <ModernCard>
            <ModernCardHeader
              title="Company Information"
              subtitle="Business details and identification"
              icon={<Building2 className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernInput
                label="BIN (Business Identification Number)"
                placeholder="004223577-0205"
                value={formData.bin}
                onChange={(value) => setFormData({ ...formData, bin: value })}
                required
              />

              <ModernInput
                label="Taxpayer Name"
                placeholder="M S RAHMAN TRADERS"
                value={formData.taxpayerName}
                onChange={(value) =>
                  setFormData({ ...formData, taxpayerName: value })
                }
                required
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white placeholder:text-gray-400"
                  placeholder="174. Siddique Bazar, Dhaka"
                  rows={3}
                  required
                />
              </div>
            </div>
          </ModernCard>

          {/* VAT Settings */}
          <ModernCard>
            <ModernCardHeader
              title="VAT Configuration"
              subtitle="Value Added Tax settings"
              icon={<Calculator className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernSelect
                label="Default VAT Rate"
                value={formData.vatRateDefault}
                onChange={(value) =>
                  setFormData({ ...formData, vatRateDefault: value })
                }
                options={vatRateOptions}
              />

              <ModernInput
                label="Simple Challan Threshold"
                placeholder="200000"
                type="number"
                prefix="৳"
                value={formData.simpleChalanThreshold}
                onChange={(value) =>
                  setFormData({ ...formData, simpleChalanThreshold: value })
                }
              />
            </div>
          </ModernCard>

          {/* Product Settings */}
          <ModernCard>
            <ModernCardHeader
              title="Product Configuration"
              subtitle="Default product settings"
              icon={<Package className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernSelect
                label="System Currency"
                value={formData.currency}
                onChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
                options={currencyOptions}
              />

              <ModernInput
                label="Default Tests per Kit"
                placeholder="120"
                type="number"
                min="1"
                value={formData.testsPerKitDefault.toString()}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    testsPerKitDefault: parseInt(value) || 120,
                  })
                }
              />
            </div>
          </ModernCard>

          {/* System Information */}
          <ModernCard>
            <ModernCardHeader
              title="System Information"
              subtitle="Current system status"
              icon={<Info className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-900">
                  November 2025
                </div>
                <div className="text-sm text-blue-700">Current Tax Period</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-900">v1.0.0</div>
                <div className="text-sm text-green-700">System Version</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-900">
                  {settings?.updatedAt
                    ? new Date(settings.updatedAt).toLocaleDateString()
                    : "Never"}
                </div>
                <div className="text-sm text-purple-700">Last Updated</div>
              </div>
            </div>
          </ModernCard>

          {/* Submit Button */}
          <div className="flex justify-end">
            <ModernButton
              type="submit"
              loading={saving}
              variant="primary"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </ModernButton>
          </div>
        </form>
      </div>
    </div>
  );
}
