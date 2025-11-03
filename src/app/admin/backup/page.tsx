"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Database,
  Download,
  Upload,
  Settings,
  Shield,
  Clock,
  HardDrive,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  Loader2,
  History,
  Save,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Backup {
  id: number;
  backup_name: string;
  backup_type: string;
  description: string;
  file_size: number;
  table_count: number;
  record_count: number;
  created_by: string;
  created_at: string;
  size: string;
}

interface BackupSchedule {
  enabled: boolean;
  frequency: string;
  scheduled_time: string;
  retention_days: number;
  max_backups: number;
}

interface BackupStats {
  totalBackups: number;
  totalSize: string;
  lastBackup: string;
  autoBackups: number;
  manualBackups: number;
}

export default function BackupManagementPage() {
  const { showSuccess, showError } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedule, setSchedule] = useState<BackupSchedule>({
    enabled: true,
    frequency: "daily",
    scheduled_time: "02:00",
    retention_days: 30,
    max_backups: 50,
  });
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: "0 MB",
    lastBackup: "Never",
    autoBackups: 0,
    manualBackups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupDescription, setBackupDescription] = useState("");
  const [backupType, setBackupType] = useState("full");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  useEffect(() => {
    fetchBackups();
    fetchScheduleAndStats();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/admin/backup");
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        showError("Error", "Failed to fetch backups");
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
      showError("Error", "Failed to fetch backups");
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleAndStats = async () => {
    try {
      const response = await fetch("/api/admin/backup/schedule");
      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule);
        setStats(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: backupType,
          description: backupDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess("Success", `Backup created: ${data.backup.name}`);
        setBackupDescription("");
        fetchBackups();
        fetchScheduleAndStats();
      } else {
        const error = await response.json();
        showError("Error", error.error || "Failed to create backup");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      showError("Error", "Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (backupId: number, backupName: string) => {
    try {
      const response = await fetch(
        `/api/admin/backup?id=${backupId}&download=true`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${backupName}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess("Success", "Backup downloaded successfully");
      } else {
        showError("Error", "Failed to download backup");
      }
    } catch (error) {
      console.error("Error downloading backup:", error);
      showError("Error", "Failed to download backup");
    }
  };

  const restoreBackup = async (backupId: number, backupName: string) => {
    setRestoring(true);
    try {
      const response = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupId,
          restoreType: "full",
          createBackupFirst: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          "Success",
          `Backup restored successfully. ${data.summary.successful} tables restored.`
        );
        fetchBackups();
      } else {
        const error = await response.json();
        showError("Error", error.error || "Failed to restore backup");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      showError("Error", "Failed to restore backup");
    } finally {
      setRestoring(false);
    }
  };

  const updateSchedule = async () => {
    try {
      const response = await fetch("/api/admin/backup/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      if (response.ok) {
        showSuccess("Success", "Backup schedule updated successfully");
        setIsScheduleDialogOpen(false);
        fetchScheduleAndStats();
      } else {
        const error = await response.json();
        showError("Error", error.error || "Failed to update schedule");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      showError("Error", "Failed to update schedule");
    }
  };

  const initializeBackupSystem = async () => {
    try {
      const response = await fetch("/api/admin/init-backup-tables", {
        method: "POST",
      });

      if (response.ok) {
        showSuccess("Success", "Backup system initialized successfully");
        fetchBackups();
        fetchScheduleAndStats();
      } else {
        const error = await response.json();
        showError("Error", error.error || "Failed to initialize backup system");
      }
    } catch (error) {
      console.error("Error initializing backup system:", error);
      showError("Error", "Failed to initialize backup system");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Backup & Restore Management
          </h1>
          <p className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Comprehensive data protection and recovery system
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Total Backups
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.totalBackups}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Total Size
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.totalSize}
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Auto Backups
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.autoBackups}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Manual Backups
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.manualBackups}
                  </p>
                </div>
                <Save className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-800">
                    Last Backup
                  </p>
                  <p className="text-sm font-bold text-indigo-900">
                    {stats.lastBackup}
                  </p>
                </div>
                <History className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Backup */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Create New Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Backup Type</Label>
                <Select value={backupType} onValueChange={setBackupType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full System Backup</SelectItem>
                    <SelectItem value="partial">Partial Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Describe this backup..."
                  rows={2}
                />
              </div>

              <Button
                onClick={createBackup}
                disabled={creating}
                className="w-full"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Backup
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Settings */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Backup Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Automatic Backups:</span>
                <Badge variant={schedule.enabled ? "default" : "secondary"}>
                  {schedule.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Frequency:</span>
                <Badge variant="outline">{schedule.frequency}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Scheduled Time:</span>
                <Badge variant="outline">{schedule.scheduled_time}</Badge>
              </div>

              <div className="flex gap-2">
                <Dialog
                  open={isScheduleDialogOpen}
                  onOpenChange={setIsScheduleDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Backup Schedule Settings</DialogTitle>
                      <DialogDescription>
                        Configure automatic backup schedule and retention policy
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              enabled: e.target.checked,
                            })
                          }
                        />
                        <Label>Enable automatic backups</Label>
                      </div>

                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={schedule.frequency}
                          onValueChange={(value) =>
                            setSchedule({ ...schedule, frequency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Scheduled Time</Label>
                        <Input
                          type="time"
                          value={schedule.scheduled_time}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              scheduled_time: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Retention Days</Label>
                        <Input
                          type="number"
                          value={schedule.retention_days}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              retention_days: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Max Backups</Label>
                        <Input
                          type="number"
                          value={schedule.max_backups}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              max_backups: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsScheduleDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={updateSchedule}>Save Settings</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={initializeBackupSystem} variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Initialize System
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backups List */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Backup History ({backups.length})
              </CardTitle>
              <Button onClick={fetchBackups} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading backups...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Backups Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first backup to get started with data protection.
                </p>
                <Button onClick={createBackup} disabled={creating}>
                  <Save className="w-4 h-4 mr-2" />
                  Create First Backup
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Backup Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {backup.backup_name}
                            </div>
                            {backup.description && (
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {backup.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <Badge
                              variant={
                                backup.backup_type === "auto"
                                  ? "default"
                                  : "secondary"
                              }
                              className="mb-1"
                            >
                              {backup.backup_type}
                            </Badge>
                            <div className="text-sm text-gray-500">
                              {backup.size}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {backup.table_count} tables
                            </div>
                            <div className="text-gray-500">
                              {backup.record_count.toLocaleString()} records
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {backup.created_at}
                            </div>
                            <div className="text-gray-500">
                              by {backup.created_by}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                downloadBackup(backup.id, backup.backup_name)
                              }
                            >
                              <Download className="w-3 h-3" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700"
                                  disabled={restoring}
                                >
                                  {restoring ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    Restore Backup
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will restore the backup "
                                    {backup.backup_name}" and replace all
                                    current data. A safety backup will be
                                    created automatically before restoration.
                                    <br />
                                    <br />
                                    <strong>
                                      This action cannot be undone!
                                    </strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      restoreBackup(
                                        backup.id,
                                        backup.backup_name
                                      )
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Restore Backup
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </div>
  );
}
