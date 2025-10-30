"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Banknote,
  Save,
  Edit,
  X,
} from "lucide-react";

interface ClosingBalance {
  year: number;
  month: number;
  openingBalance: number;
  currentMonthAddition: number;
  usedAmount: number;
  closingBalance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClosingBalancePage() {
  const [balances, setBalances] = useState<ClosingBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBalance, setEditingBalance] = useState<ClosingBalance | null>(
    null
  );
  const [needsMigration, setNeedsMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    currentMonthAddition: "",
    usedAmount: "",
    notes: "",
  });

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setError(null);
      const response = await fetch("/api/vat/closing-balance");

      // Always try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        setError("Invalid response from server");
        setBalances([]);
        setNeedsMigration(false);
        return;
      }

      console.log("API Response:", data);

      // Handle migration needed case (can come with 200 or error status)
      if (data.needsMigration) {
        setNeedsMigration(true);
        setBalances([]);
        setError(null);
        return;
      }

      // Handle error responses
      if (!response.ok) {
        console.error("API Error Response:", data);
        setError(`API Error: ${data.error || data.message || "Unknown error"}`);
        setBalances([]);
        setNeedsMigration(false);
        return;
      }

      // Handle successful data response
      if (Array.isArray(data)) {
        setBalances(data);
        setNeedsMigration(false);
        setError(null);
      } else {
        // Handle other response formats
        console.log("Unexpected response format:", data);
        setError("Unexpected response format from server");
        setBalances([]);
        setNeedsMigration(false);
      }
    } catch (error) {
      console.error("Network error fetching balances:", error);
      setError(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setBalances([]);
      setNeedsMigration(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    if (
      !confirm(
        "This will update the closing balance table structure. Continue?"
      )
    ) {
      return;
    }

    setMigrating(true);
    try {
      const response = await fetch("/api/vat/closing-balance/migrate", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Migration successful! ${result.message}`);
        await fetchBalances();
      } else {
        console.error("Migration API Error:", result);
        alert(
          `Migration failed: ${result.error || "Unknown error"}\nDetails: ${
            result.details || "Check console for more info"
          }`
        );
      }
    } catch (error) {
      console.error("Migration network error:", error);
      alert(
        "Migration failed due to network error. Please check the console for details."
      );
    } finally {
      setMigrating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/vat/closing-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: formData.year,
          month: formData.month,
          currentMonthAddition: parseFloat(
            formData.currentMonthAddition || "0"
          ),
          usedAmount: parseFloat(formData.usedAmount || "0"),
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        await fetchBalances();
        setShowAddForm(false);
        setFormData({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          currentMonthAddition: "",
          usedAmount: "",
          notes: "",
        });
        alert("Balance saved successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error saving balance:", error);
      alert("Failed to save balance");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (balance: ClosingBalance) => {
    setEditingBalance(balance);
    setFormData({
      year: balance.year,
      month: balance.month,
      currentMonthAddition: balance.currentMonthAddition.toString(),
      usedAmount: balance.usedAmount.toString(),
      notes: balance.notes || "",
    });
    setShowAddForm(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBalance) return;

    setSaving(true);

    try {
      const response = await fetch("/api/vat/closing-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: formData.year,
          month: formData.month,
          currentMonthAddition: parseFloat(
            formData.currentMonthAddition || "0"
          ),
          usedAmount: parseFloat(formData.usedAmount || "0"),
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        await fetchBalances();
        setEditingBalance(null);
        setFormData({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          currentMonthAddition: "",
          usedAmount: "",
          notes: "",
        });
        alert("Balance updated successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Failed to update balance");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingBalance(null);
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      currentMonthAddition: "",
      usedAmount: "",
      notes: "",
    });
  };

  const getMonthName = (month: number) => {
    const months = [
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
    return months[month - 1];
  };

  const getTotalBalance = () => {
    return balances.reduce((sum, balance) => sum + balance.closingBalance, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading Closing Balances
                </h3>
                <p className="text-gray-600">Please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Banknote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Closing Balance Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track VAT closing balances like bank statement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchBalances}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              {needsMigration && (
                <Button
                  variant="outline"
                  onClick={handleMigration}
                  disabled={migrating}
                  className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  {migrating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Migrate Table
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => {
                  if (editingBalance) {
                    cancelEdit();
                  } else {
                    setShowAddForm(!showAddForm);
                  }
                }}
                className="gap-2"
                disabled={needsMigration}
              >
                <Plus className="w-4 h-4" />
                {showAddForm || editingBalance ? "Cancel" : "Add Balance Entry"}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Error Loading Data
                  </h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Migration Notice */}
        {needsMigration && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">
                    Database Migration Required
                  </h3>
                  <p className="text-orange-700">
                    Your closing balance table needs to be created or updated to
                    support the new bank statement format. Click "Migrate Table"
                    to update the structure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingBalance) && !needsMigration && (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingBalance ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Edit Balance Entry - {getMonthName(
                      editingBalance.month
                    )}{" "}
                    {editingBalance.year}
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add Closing Balance Entry
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={editingBalance ? handleUpdateSubmit : handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: parseInt(e.target.value),
                        })
                      }
                      disabled={!!editingBalance}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Input
                      id="month"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          month: parseInt(e.target.value),
                        })
                      }
                      disabled={!!editingBalance}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addition">Current Month Addition (৳)</Label>
                    <Input
                      id="addition"
                      type="number"
                      step="0.01"
                      value={formData.currentMonthAddition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentMonthAddition: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="used">Used Amount (৳)</Label>
                    <Input
                      id="used"
                      type="number"
                      step="0.01"
                      value={formData.usedAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usedAmount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      editingBalance ? cancelEdit : () => setShowAddForm(false)
                    }
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {editingBalance ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingBalance ? "Update Balance" : "Save Balance"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Total Balance
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    ৳{getTotalBalance().toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Total Entries
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {balances.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Latest Month
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {balances.length > 0
                      ? `${getMonthName(balances[0].month)} ${balances[0].year}`
                      : "No data"}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Statement */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Closing Balance Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No balance records found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first closing balance entry
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Entry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                        Period
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                        Opening Balance
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                        Addition
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                        Used
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                        Closing Balance
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                        Notes
                      </th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {balances.map((balance, index) => (
                      <tr
                        key={`${balance.year}-${balance.month}`}
                        className="hover:bg-muted/50"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {getMonthName(balance.month)} {balance.year}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-gray-600">
                            ৳{balance.openingBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {balance.currentMonthAddition > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-green-600 font-medium">
                                ৳{balance.currentMonthAddition.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {balance.usedAmount > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <TrendingDown className="h-3 w-3 text-red-600" />
                              <span className="text-red-600 font-medium">
                                ৳{balance.usedAmount.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-lg font-bold text-blue-600">
                            ৳{balance.closingBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-600">
                            {balance.notes || "-"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(balance)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
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
    </div>
  );
}
