"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Plus, Trash2, Send, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

type CampaignStatus = "pending" | "sending" | "sent" | "failed";
type CampaignType = "cycle-start" | "reminder" | "manual";

type Campaign = {
  id: string;
  name: string;
  campaignType: CampaignType;
  cycleId: string;
  projectName: string;
  targetRoles: string[];
  scheduledAt: string;
  sentAt: string | null;
  status: CampaignStatus;
  recipientCount: number;
  errorMessage: string | null;
  createdAt: string;
};

type ReportingCycle = {
  id: string;
  name: string;
  status: string;
  linkedProjects: string[];
  targetRoles: string[];
};

const statusBadge: Record<CampaignStatus, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-yellow-100 text-yellow-700" },
  sending: { label: "Sending", class: "bg-slate-100 text-slate-700" },
  sent: { label: "Sent", class: "bg-green-100 text-green-700" },
  failed: { label: "Failed", class: "bg-red-100 text-red-700" },
};

const typeLabel: Record<CampaignType, string> = {
  "cycle-start": "Cycle Start",
  reminder: "Reminder",
  manual: "Manual",
};

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [cycles, setCycles] = useState<ReportingCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  const [draft, setDraft] = useState({
    name: "",
    campaignType: "manual" as CampaignType,
    cycleId: "",
    projectName: "",
    targetRoles: [] as string[],
    scheduledAt: "",
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/email-campaigns?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load campaigns.");
      }
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCycles = useCallback(async () => {
    try {
      const response = await fetch("/api/reporting-cycles");
      if (response.ok) {
        const data = await response.json();
        setCycles(data.cycles || []);
      } else {
        console.error(
          "[Campaigns] Failed to load cycles:",
          response.status,
          await response.text().catch(() => ""),
        );
      }
    } catch (err) {
      console.error("[Campaigns] Error loading cycles:", err);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchCycles();
  }, [fetchCampaigns, fetchCycles]);

  const selectedCycle = cycles.find((c) => c.id === draft.cycleId);

  const openCreate = () => {
    setDraft({
      name: "",
      campaignType: "manual",
      cycleId: "",
      projectName: "",
      targetRoles: [],
      scheduledAt: new Date().toISOString().slice(0, 16),
    });
    setIsDialogOpen(true);
  };

  const createCampaign = async () => {
    if (!draft.name.trim() || !draft.cycleId || !draft.scheduledAt) return;

    try {
      setError("");
      const response = await fetch("/api/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          campaignType: draft.campaignType,
          cycleId: draft.cycleId,
          projectName: draft.projectName,
          targetRoles: draft.targetRoles,
          scheduledAt: draft.scheduledAt,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create campaign.");
      }
      setIsDialogOpen(false);
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign.");
    }
  };

  const deleteCampaign = async () => {
    if (!deletingCampaign) return;
    try {
      setError("");
      const response = await fetch("/api/email-campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingCampaign.id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete campaign.");
      }
      setDeletingCampaign(null);
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete campaign.");
    }
  };

  const sendNow = async () => {
    try {
      setError("");
      const response = await fetch("/api/cron/process-campaigns", {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to process campaigns.");
      }
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send.");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const toggleRole = (role: string) => {
    setDraft((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  return (
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <PageHeader
        title="Email Campaigns"
        subtitle="Schedule and manage email notifications"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void sendNow()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Process Now
            </Button>
            <Button
              onClick={openCreate}
              className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Toolbar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        filters={
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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
      ) : campaigns.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No email campaigns yet. Create one to schedule notifications.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">Scheduled</th>
                <th className="px-4 py-3 font-medium text-slate-600">Sent</th>
                <th className="px-4 py-3 font-medium text-slate-600">Recipients</th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {campaign.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {typeLabel[campaign.campaignType]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge[campaign.status].class}`}
                    >
                      {statusBadge[campaign.status].label}
                    </span>
                    {campaign.errorMessage && (
                      <span
                        className="ml-1 cursor-help text-xs text-slate-400"
                        title={campaign.errorMessage}
                      >
                        ⓘ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(campaign.scheduledAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {campaign.sentAt ? formatDate(campaign.sentAt) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {campaign.recipientCount || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDeletingCampaign(campaign)}
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
        Showing {campaigns.length} campaigns
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Schedule email notifications for a reporting cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Campaign Name
              </label>
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Q1 2026 Notification"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Reporting Cycle
              </label>
              {cycles.length === 0 ? (
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No reporting cycles exist yet.
                  {" "}
                  <a
                    href="/dashboard/reporting-cycles"
                    className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                  >
                    Create one first
                  </a>
                  .
                </div>
              ) : (
                <Select
                  value={draft.cycleId}
                  onValueChange={(value) => {
                    const cycle = cycles.find((c) => c.id === value);
                    setDraft((prev) => ({
                      ...prev,
                      cycleId: value,
                      projectName:
                        cycle?.linkedProjects[0] || "",
                      targetRoles: cycle?.targetRoles || [],
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name} ({cycle.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Campaign Type
              </label>
              <Select
                value={draft.campaignType}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    campaignType: value as CampaignType,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cycle-start">Cycle Start</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Project
              </label>
              {!selectedCycle ? (
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  Select a cycle first.
                </div>
              ) : (selectedCycle.linkedProjects?.length || 0) === 0 ? (
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  This cycle has no linked projects.
                  {" "}
                  <a
                    href={`/dashboard/reporting-cycles`}
                    className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                  >
                    Edit the cycle
                  </a>
                  {" "}to add projects.
                </div>
              ) : (
                <Select
                  value={draft.projectName}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      projectName: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCycle.linkedProjects.map(
                      (project: string) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
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
                Scheduled Date/Time
              </label>
              <Input
                type="datetime-local"
                value={draft.scheduledAt}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    scheduledAt: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createCampaign()}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingCampaign)}
        onOpenChange={(open) => !open && setDeletingCampaign(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Delete <strong>{deletingCampaign?.name}</strong>? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCampaign(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteCampaign()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
