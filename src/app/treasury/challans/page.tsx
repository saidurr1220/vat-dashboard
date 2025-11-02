"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Banknote,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Edit,
  X,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TreasuryChallan {
  id: number;
  voucherNo: string;
  tokenNo: string;
  bank: string;
  branch: string;
  date: string;
  accountCode: string;
  amountBdt: number;
  periodYear: number;
  periodMonth: number;
  createdAt: string;
  updatedAt: string;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TreasuryChallansPage() {
  const { showSuccess, showError } = useToast();
  const [challans, setChallans] = useState<TreasuryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChallan, setEditingChallan] = useState<TreasuryChallan | null>(
    null
  );

  const [formData, setFormData] = useState({
    voucherNo: "",
    tokenNo: "",
    bank: "Sonali Bank Ltd.",
    branch: "Local Office",
    date: new Date().toISOString().split("T")[0],
    accountCode: "1/1133/0010/0311",
    amountBdt: "",
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
  });

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/treasury/challans");
      if (response.ok) {
        const data = await response.json();
        setChallans(data);
      } else {
        showError("Error", "Failed to fetch treasury challans");
      }
    } catch (error) {
      console.error("Error fetching challans:", error);
      showError("Error", "Failed to fetch treasury challans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tokenNo || !formData.amountBdt) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        amountBdt: parseFloat(formData.amountBdt),
      };

      const url = editingChallan
        ? `/api/treasury/challans/${editingChallan.id}`
        : "/api/treasury/challans";

      const method = editingChallan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showSuccess(
          "Success",
          editingChallan
            ? "Challan updated successfully"
            : "Challan added successfully"
        );
        setShowAddForm(false);
        setEditingChallan(null);
        resetForm();
        fetchChallans();
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to save challan");
      }
    } catch (error) {
      console.error("Error saving challan:", error);
      showError("Error", "Failed to save challan");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      voucherNo: "",
      tokenNo: "",
      bank: "Sonali Bank Ltd.",
      branch: "Local Office",
      date: new Date().toISOString().split("T")[0],
      accountCode: "1/1133/0010/0311",
      amountBdt: "",
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
    });
  };

  const handleEdit = (challan: TreasuryChallan) => {
    setEditingChallan(challan);
    setFormData({
      voucherNo: challan.voucherNo || "",
      tokenNo: challan.tokenNo,
      bank: challan.bank,
      branch: challan.branch,
      date: challan.date
        ? new Date(challan.date).toISOString().split("T")[0]
        : "",
      accountCode: challan.accountCode,
      amountBdt: challan.amountBdt.toString(),
      periodYear: challan.periodYear,
      periodMonth: challan.periodMonth,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this challan?")) return;

    try {
      const response = await fetch(`/api/treasury/challans/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showSuccess("Success", "Challan deleted successfully");
        fetchChallans();
      } else {
        showError("Error", "Failed to delete challan");
      }
    } catch (error) {
      console.error("Error deleting challan:", error);
      showError("Error", "Failed to delete challan");
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingChallan(null);
    resetForm();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Treasury Challans
          </h1>
          <p className="text-gray-600">Manage VAT payment challans</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchChallans()}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Challan
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              {editingChallan ? "Edit Challan" : "Add New Challan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tokenNo">Token/Challan Number *</Label>
                  <Input
                    id="tokenNo"
                    value={formData.tokenNo}
                    onChange={(e) =>
                      setFormData({ ...formData, tokenNo: e.target.value })
                    }
                    placeholder="V000012345"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="voucherNo">Voucher Number</Label>
                  <Input
                    id="voucherNo"
                    value={formData.voucherNo}
                    onChange={(e) =>
                      setFormData({ ...formData, voucherNo: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label htmlFor="amountBdt">Amount (৳) *</Label>
                  <Input
                    id="amountBdt"
                    type="number"
                    step="0.01"
                    value={formData.amountBdt}
                    onChange={(e) =>
                      setFormData({ ...formData, amountBdt: e.target.value })
                    }
                    placeholder="5000.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bank">Bank</Label>
                  <Input
                    id="bank"
                    value={formData.bank}
                    onChange={(e) =>
                      setFormData({ ...formData, bank: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="accountCode">Account Code</Label>
                  <Input
                    id="accountCode"
                    value={formData.accountCode}
                    onChange={(e) =>
                      setFormData({ ...formData, accountCode: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="date">Payment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="periodYear">Period Year</Label>
                  <Input
                    id="periodYear"
                    type="number"
                    value={formData.periodYear}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        periodYear: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="periodMonth">Period Month</Label>
                  <select
                    id="periodMonth"
                    value={formData.periodMonth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        periodMonth: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {editingChallan ? "Update" : "Save"} Challan
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Challans List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Treasury Challans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading challans...
            </div>
          ) : challans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No treasury challans found. Add your first challan above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token/Challan No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank/Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {challans.map((challan) => (
                    <tr key={challan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {challan.tokenNo}
                        {challan.voucherNo && (
                          <div className="text-xs text-gray-500">
                            Voucher: {challan.voucherNo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {challan.bank}
                        <div className="text-xs text-gray-500">
                          {challan.branch}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {challan.date
                          ? new Date(challan.date).toLocaleDateString("en-GB")
                          : "N/A"}
                        <div className="text-xs text-gray-500">
                          {challan.accountCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {monthNames[challan.periodMonth - 1]}{" "}
                        {challan.periodYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                        ৳{Number(challan.amountBdt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(challan)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(challan.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
