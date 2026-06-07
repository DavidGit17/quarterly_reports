"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Toolbar } from "@/components/admin/dashboard/toolbar";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Edit2,
  HardDrive,
  Users,
  Database,
  Archive,
  FolderKanban,
} from "lucide-react";

type StorageConfig = {
  _id: string;
  userId: string;
  displayId: string;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "coordinator" | "facilitator";
  project: string;
  storageLimit: number;
  storageUsed: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  createdAt: string;
  updatedAt: string;
};

type SummaryData = {
  totalUsers: number;
  totalAllocated: number;
  totalUsed: number;
  available: number;
  totalProjects: number;
};

type StorageResponse = {
  configs: StorageConfig[];
  summary: SummaryData;
  projects: string[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const FILE_TYPE_GROUPS = {
  Documents: ["PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "TXT"],
  Images: ["JPG", "JPEG", "PNG", "WEBP"],
  Videos: ["MP4", "MOV", "AVI"],
  Archives: ["ZIP", "RAR"],
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 GB";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const getUsagePercent = (used: number, limit: number) =>
  limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

const getUsageColor = (pct: number) => {
  if (pct <= 60) return "bg-green-500";
  if (pct <= 85) return "bg-orange-500";
  return "bg-red-500";
};

const getUsageLabel = (pct: number) => {
  if (pct <= 30) return "Low Usage";
  if (pct <= 60) return "Medium Usage";
  if (pct <= 85) return "High Usage";
  return "Near Limit";
};

const getUsageBadgeClass = (pct: number) => {
  if (pct <= 30) return "bg-green-100 text-green-800";
  if (pct <= 60) return "bg-blue-100 text-blue-800";
  if (pct <= 85) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};

export default function StoragePage() {
  const [configs, setConfigs] = useState<StorageConfig[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalUsers: 0, totalAllocated: 0, totalUsed: 0, available: 0, totalProjects: 0,
  });
  const [projects, setProjects] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingConfig, setEditingConfig] = useState<StorageConfig | null>(null);
  const [editStorageLimit, setEditStorageLimit] = useState(10);
  const [editStorageUnit, setEditStorageUnit] = useState<"MB" | "GB" | "TB">("GB");
  const [editMaxFileSize, setEditMaxFileSize] = useState(2);
  const [editFileSizeUnit, setEditFileSizeUnit] = useState<"MB" | "GB" | "TB">("GB");
  const [editAllowedTypes, setEditAllowedTypes] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (projectFilter !== "all") params.set("project", projectFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchValue) params.set("search", searchValue);
      params.set("page", String(currentPage));
      params.set("limit", "50");

      const response = await fetch(`/api/admin/storage?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.message || "Failed to fetch storage data.");
        return;
      }
      const data = (await response.json()) as StorageResponse;
      setConfigs(data.configs || []);
      setSummary(data.summary || { totalUsers: 0, totalAllocated: 0, totalUsed: 0, available: 0, totalProjects: 0 });
      setProjects(data.projects || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch {
      setErrorMessage("Unable to load storage data.");
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, projectFilter, statusFilter, searchValue, currentPage]);

  const filterRef = useRef({ roleFilter, projectFilter, statusFilter, searchValue });

  useEffect(() => {
    const prev = filterRef.current;
    const newFilters = { roleFilter, projectFilter, statusFilter, searchValue };
    const filtersChanged =
      prev.roleFilter !== newFilters.roleFilter ||
      prev.projectFilter !== newFilters.projectFilter ||
      prev.statusFilter !== newFilters.statusFilter ||
      prev.searchValue !== newFilters.searchValue;

    if (filtersChanged) {
      filterRef.current = newFilters;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }
    void fetchData();
  }, [roleFilter, projectFilter, statusFilter, searchValue, currentPage, fetchData]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchValue(searchInput);
  };

  const openEdit = (config: StorageConfig) => {
    setEditingConfig(config);
    const limitGB = config.storageLimit / (1024 * 1024 * 1024);
    if (limitGB >= 1) {
      setEditStorageLimit(limitGB);
      setEditStorageUnit("GB");
    } else {
      setEditStorageLimit(config.storageLimit / (1024 * 1024));
      setEditStorageUnit("MB");
    }
    const sizeGB = config.maxFileSize / (1024 * 1024 * 1024);
    if (sizeGB >= 1) {
      setEditMaxFileSize(sizeGB);
      setEditFileSizeUnit("GB");
    } else {
      setEditMaxFileSize(config.maxFileSize / (1024 * 1024));
      setEditFileSizeUnit("MB");
    }
    setEditAllowedTypes(new Set(config.allowedFileTypes));
    setEditError("");
    setIsEditDialogOpen(true);
  };

  const toBytes = (value: number, unit: "MB" | "GB" | "TB") => {
    switch (unit) {
      case "TB": return value * 1024 * 1024 * 1024 * 1024;
      case "GB": return value * 1024 * 1024 * 1024;
      case "MB": return value * 1024 * 1024;
    }
  };

  const toggleFileType = (type: string) => {
    setEditAllowedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleSave = async () => {
    if (!editingConfig) return;
    setEditError("");

    const storageLimitBytes = toBytes(editStorageLimit, editStorageUnit);
    if (storageLimitBytes < 1048576) {
      setEditError("Storage limit must be at least 1 MB.");
      return;
    }
    const maxFileSizeBytes = toBytes(editMaxFileSize, editFileSizeUnit);
    if (maxFileSizeBytes < 1048576) {
      setEditError("Max file size must be at least 1 MB.");
      return;
    }
    if (editAllowedTypes.size === 0) {
      setEditError("At least one file type must be selected.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/storage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingConfig._id,
          storageLimit: storageLimitBytes,
          maxFileSize: maxFileSizeBytes,
          allowedFileTypes: [...editAllowedTypes],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setEditError(data.message || "Failed to update storage configuration.");
        return;
      }
      setIsEditDialogOpen(false);
      setEditingConfig(null);
      setSuccessMessage("Storage configuration updated successfully.");
      void fetchData();
    } catch {
      setEditError("Failed to update storage configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const summaryCards = useMemo(() => [
    { label: "Total Users", value: summary.totalUsers, icon: Users, color: "text-slate-400" },
    { label: "Total Allocated Storage", value: formatBytes(summary.totalAllocated), icon: Database, color: "text-blue-500" },
    { label: "Total Used Storage", value: formatBytes(summary.totalUsed), icon: HardDrive, color: "text-orange-500" },
    { label: "Available Storage", value: formatBytes(summary.available), icon: Archive, color: "text-green-500" },
    { label: "Total Projects", value: summary.totalProjects, icon: FolderKanban, color: "text-slate-400" },
  ], [summary]);

  return (
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <PageHeader
        title="Storage Management"
        subtitle="Manage storage quotas, usage limits, and upload permissions across users and projects."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void fetchData()}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        }
      />

      {successMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Toolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by ID, username, project, or role..."
        onSearchSubmit={handleSearch}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="facilitator">Facilitator</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low Usage</SelectItem>
                <SelectItem value="medium">Medium Usage</SelectItem>
                <SelectItem value="high">High Usage</SelectItem>
                <SelectItem value="critical">Near Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="border border-slate-200 rounded-2xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>User ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Storage Used</TableHead>
              <TableHead>Storage Limit</TableHead>
              <TableHead>Usage %</TableHead>
              <TableHead>Allowed File Types</TableHead>
              <TableHead>Max File Size</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((j) => (
                    <TableCell key={j} className="h-12">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <HardDrive className="w-10 h-10 text-slate-300" />
                    <p className="text-sm font-medium">No matching users found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchInput("");
                        setSearchValue("");
                        setRoleFilter("all");
                        setProjectFilter("all");
                        setStatusFilter("all");
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              configs.map((config) => {
                const pct = getUsagePercent(config.storageUsed, config.storageLimit);
                return (
                  <TableRow key={config._id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900 font-mono text-xs">
                      {config.displayId}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {config.username}
                    </TableCell>
                    <TableCell className="capitalize text-slate-600">
                      {config.role}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {config.project || "-"}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {formatBytes(config.storageUsed)} / {formatBytes(config.storageLimit)}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getUsageColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-2xl text-xs font-medium ${getUsageBadgeClass(pct)}`}>
                        {pct}%
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {config.allowedFileTypes.join(", ")}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {formatBytes(config.maxFileSize)}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(config)}
                          title="Edit Storage Settings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
          <div className="text-sm text-slate-600">
            Showing {(pagination.page - 1) * pagination.limit + 1}&ndash;
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Storage Configuration</DialogTitle>
            <DialogDescription>
              Configure storage limits, file types, and size restrictions.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {editError}
            </div>
          )}

          {editingConfig && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500">User ID</p>
                  <p className="text-sm font-medium text-slate-900 font-mono">{editingConfig.displayId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Username</p>
                  <p className="text-sm font-medium text-slate-900">{editingConfig.username}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="text-sm font-medium capitalize text-slate-900">{editingConfig.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Project</p>
                  <p className="text-sm font-medium text-slate-900">{editingConfig.project || "-"}</p>
                </div>
                <div className="col-span-full">
                  <p className="text-xs text-slate-500">Current Usage</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatBytes(editingConfig.storageUsed)} / {formatBytes(editingConfig.storageLimit)}
                    {" "}({getUsagePercent(editingConfig.storageUsed, editingConfig.storageLimit)}%)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Storage Limit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={editStorageLimit}
                    onChange={(e) => setEditStorageLimit(Math.max(1, Number(e.target.value)))}
                    className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                  <Select value={editStorageUnit} onValueChange={(v) => setEditStorageUnit(v as "MB" | "GB" | "TB")}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="MB">MB</SelectItem>
                      <SelectItem value="GB">GB</SelectItem>
                      <SelectItem value="TB">TB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>Current Usage: {formatBytes(editingConfig.storageUsed)}</span>
                  <span>Remaining: {formatBytes(toBytes(editStorageLimit, editStorageUnit) - editingConfig.storageUsed)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Maximum File Size</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={editMaxFileSize}
                    onChange={(e) => setEditMaxFileSize(Math.max(1, Number(e.target.value)))}
                    className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                  <Select value={editFileSizeUnit} onValueChange={(v) => setEditFileSizeUnit(v as "MB" | "GB" | "TB")}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="MB">MB</SelectItem>
                      <SelectItem value="GB">GB</SelectItem>
                      <SelectItem value="TB">TB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Allowed File Types</label>
                <div className="space-y-3">
                  {Object.entries(FILE_TYPE_GROUPS).map(([group, types]) => (
                    <div key={group}>
                      <p className="text-xs font-medium text-slate-500 mb-1.5">{group}</p>
                      <div className="flex flex-wrap gap-2">
                        {types.map((type) => {
                          const selected = editAllowedTypes.has(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => toggleFileType(type)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                selected
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
