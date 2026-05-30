"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2, Pencil } from "lucide-react";

type CycleStatus = "upcoming" | "active" | "closed";

type ReportingCycle = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  linkedProjects: string[];
  targetRoles: string[];
  reminderSchedule: string;
  status: CycleStatus;
  createdAt: string;
};

type CycleDraft = {
  name: string;
  startDate: string;
  endDate: string;
  linkedProjects: string[];
  targetRoles: string[];
  reminderSchedule: string;
  status: CycleStatus;
};

const emptyDraft: CycleDraft = {
  name: "",
  startDate: "",
  endDate: "",
  linkedProjects: [],
  targetRoles: ["coordinator", "facilitator"],
  reminderSchedule: "",
  status: "upcoming",
};

const statusBadge: Record<CycleStatus, { label: string; class: string }> = {
  upcoming: {
    label: "Upcoming",
    class: "bg-slate-100 text-slate-700",
  },
  active: {
    label: "Active",
    class: "bg-green-100 text-green-700",
  },
  closed: {
    label: "Closed",
    class: "bg-slate-100 text-slate-600",
  },
};

const toDraft = (cycle: ReportingCycle): CycleDraft => ({
  name: cycle.name,
  startDate: cycle.startDate.slice(0, 10),
  endDate: cycle.endDate.slice(0, 10),
  linkedProjects: cycle.linkedProjects,
  targetRoles: cycle.targetRoles,
  reminderSchedule: cycle.reminderSchedule,
  status: cycle.status,
});

export default function ReportingCyclesPage() {
  const [cycles, setCycles] = useState<ReportingCycle[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectsError, setProjectsError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CycleStatus>("all");
  const [editingCycle, setEditingCycle] = useState<ReportingCycle | null>(null);
  const [deletingCycle, setDeletingCycle] = useState<ReportingCycle | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draft, setDraft] = useState<CycleDraft>(emptyDraft);

  const fetchCycles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/reporting-cycles");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load cycles.");
      }
      const data = await response.json();
      setCycles(data.cycles || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load cycles.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch {
      setProjectsError("Failed to load projects for linking.");
    }
  }, []);

  useEffect(() => {
    fetchCycles();
    fetchProjects();
  }, [fetchCycles, fetchProjects]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredCycles = useMemo(
    () =>
      cycles.filter((cycle) => {
        const matchesSearch =
          cycle.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          cycle.linkedProjects.some((p) =>
            p.toLowerCase().includes(debouncedSearch.toLowerCase()),
          );
        const matchesStatus =
          statusFilter === "all" || cycle.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [cycles, debouncedSearch, statusFilter],
  );

  const openCreate = () => {
    setEditingCycle(null);
    setDraft(emptyDraft);
    setIsDialogOpen(true);
  };

  const openEdit = (cycle: ReportingCycle) => {
    setEditingCycle(cycle);
    setDraft(toDraft(cycle));
    setIsDialogOpen(true);
  };

  const toggleProject = (projectName: string) => {
    setDraft((prev) => ({
      ...prev,
      linkedProjects: prev.linkedProjects.includes(projectName)
        ? prev.linkedProjects.filter((p) => p !== projectName)
        : [...prev.linkedProjects, projectName],
    }));
  };

  const toggleRole = (role: string) => {
    setDraft((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const save = async () => {
    const name = draft.name.trim();
    if (!name || !draft.startDate || !draft.endDate) {
      return;
    }

    if (draft.linkedProjects.length === 0) {
      setError("Select at least one project.");
      return;
    }

    try {
      setError("");

      if (editingCycle) {
        const response = await fetch("/api/reporting-cycles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCycle.id,
            name,
            startDate: draft.startDate,
            endDate: draft.endDate,
            linkedProjects: draft.linkedProjects,
            targetRoles: draft.targetRoles,
            reminderSchedule: draft.reminderSchedule,
            status: draft.status,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update cycle.");
        }
      } else {
        const response = await fetch("/api/reporting-cycles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            startDate: draft.startDate,
            endDate: draft.endDate,
            linkedProjects: draft.linkedProjects,
            targetRoles: draft.targetRoles,
            reminderSchedule: draft.reminderSchedule,
            status: draft.status,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to create cycle.");
        }
      }

      setIsDialogOpen(false);
      await fetchCycles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save cycle.",
      );
    }
  };

  const deleteCycle = async () => {
    if (!deletingCycle) return;

    try {
      setError("");
      const response = await fetch("/api/reporting-cycles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingCycle.id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete cycle.");
      }
      setDeletingCycle(null);
      await fetchCycles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete cycle.",
      );
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <PageHeader
        title="Reporting Cycles"
        subtitle="Define and manage reporting periods"
        action={
          <Button
            onClick={openCreate}
            className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Cycle
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {projectsError && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {projectsError}
        </div>
      )}

      <Toolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by cycle name or project..."
        filters={
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {loading ? (
        <div className="animate-pulse mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <div className="bg-slate-50 p-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border-t border-slate-100">
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredCycles.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          {cycles.length === 0
            ? "No reporting cycles yet. Create one to get started."
            : "No cycles match your filters."}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Start Date
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  End Date
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Projects
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Roles
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCycles.map((cycle) => (
                <tr
                  key={cycle.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {cycle.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge[cycle.status].class}`}
                    >
                      {statusBadge[cycle.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(cycle.startDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(cycle.endDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                    {cycle.linkedProjects.join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {cycle.targetRoles.join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(cycle)}
                        className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCycle(cycle)}
                        className="rounded p-1 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-slate-600">
        Showing {filteredCycles.length} of {cycles.length} cycles
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? "Edit Reporting Cycle" : "Create Reporting Cycle"}
            </DialogTitle>
            <DialogDescription>
              {editingCycle
                ? "Update the cycle details below."
                : "Define a new reporting period."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cycle Name
              </label>
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Q1 2026, School Term 1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  End Date
                </label>
                <Input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    status: value as CycleStatus,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Linked Projects
              </label>
              {projects.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No projects available. Create a project first.
                </p>
              ) : (
                <div className="max-h-32 overflow-y-auto rounded border border-slate-200 p-2">
                  {projects.map((project) => {
                    const checked = draft.linkedProjects.includes(project.name);
                    return (
                      <label
                        key={project.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProject(project.name)}
                          className="rounded border-slate-300"
                        />
                        {project.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Target Roles
              </label>
              <div className="flex gap-4">
                {["coordinator", "facilitator"].map((role) => (
                  <label
                    key={role}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={draft.targetRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded border-slate-300"
                    />
                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Reminder Schedule (cron)
              </label>
              <Input
                value={draft.reminderSchedule}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    reminderSchedule: e.target.value,
                  }))
                }
                placeholder="e.g. 0 9 * * 1 (cron — Phase 2)"
                disabled
              />
              <p className="mt-1 text-xs text-slate-400">
                Email integration coming in Phase 2.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => void save()}>
              {editingCycle ? "Save Changes" : "Create Cycle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingCycle)}
        onOpenChange={(open) => !open && setDeletingCycle(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reporting Cycle</DialogTitle>
            <DialogDescription>
              Delete <strong>{deletingCycle?.name}</strong>? This cannot be
              undone. Reports submitted under this cycle will retain the cycle
              reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCycle(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void deleteCycle()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
