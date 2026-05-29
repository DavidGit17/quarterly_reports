"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Toolbar } from "@/components/admin/dashboard/toolbar";
import { MultiSelect } from "@/components/ui/multi-select";
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
import { Plus, Trash2, Pencil, Pause, Play, CalendarDays, Clock, Send } from "lucide-react";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import type { AdminUserRecord } from "@/app/api/admin/users/route";
import { cn } from "@/lib/shared/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type RuleStatus = "active" | "paused" | "disabled";
type ScheduleType = "monthly" | "quarterly" | "custom";
type RecipientType = "coordinators" | "facilitators" | "both" | "specific";

type DistributionRule = {
  id: string;
  name: string;
  projects: string[];
  forms: string[];
  recipients: RecipientType;
  specificUsers: string[];
  scheduleType: ScheduleType;
  scheduleConfig: {
    day?: number;
    months?: number[];
    monthDays?: Record<number, number>;
    date?: string;
    time?: string;
  };
  emailSubject: string;
  customMessage: string;
  invitationMessage: string;
  allowEdits: boolean;
  deadline: string;
  expirationDate: string;
  status: RuleStatus;
  lastSentAt: string | null;
  nextSendAt: string | null;
  createdAt: string;
};

type Draft = {
  name: string;
  projects: string[];
  forms: string[];
  recipients: RecipientType;
  specificUsers: string[];
  scheduleType: ScheduleType;
  scheduleConfig: {
    day?: number;
    months?: number[];
    monthDays?: Record<number, number>;
    date?: string;
    time?: string;
  };
  emailSubject: string;
  customMessage: string;
  invitationMessage: string;
  allowEdits: boolean;
  deadline: string;
  expirationDate: string;
  status: RuleStatus;
};

const MONTHS = [
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

const emptyDraft: Draft = {
  name: "",
  projects: [],
  forms: [],
  recipients: "both",
  specificUsers: [],
  scheduleType: "quarterly",
  scheduleConfig: { months: [1, 4, 7, 10], day: 1, time: "08:00" },
  emailSubject: "",
  customMessage: "",
  invitationMessage: "",
  allowEdits: true,
  deadline: "",
  expirationDate: "",
  status: "active",
};

const statusBadge: Record<RuleStatus, { label: string; class: string }> = {
  active: { label: "Active", class: "bg-green-100 text-green-700" },
  paused: { label: "Paused", class: "bg-yellow-100 text-yellow-700" },
  disabled: { label: "Disabled", class: "bg-slate-100 text-slate-600" },
};

const scheduleLabel: Record<ScheduleType, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  custom: "Custom Date",
};

const recipientLabel: Record<string, string> = {
  coordinators: "Coordinators",
  facilitators: "Facilitators",
  both: "Both",
  specific: "Specific Users",
};

const ordinal = (n: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]);
};

const formatDate = (iso: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (time: string): string => {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const toDraft = (rule: DistributionRule): Draft => ({
  name: rule.name,
  projects: rule.projects,
  forms: rule.forms,
  recipients: rule.recipients,
  specificUsers: rule.specificUsers,
  scheduleType: rule.scheduleType,
  scheduleConfig: { ...rule.scheduleConfig },
  emailSubject: rule.emailSubject,
  customMessage: rule.customMessage,
  invitationMessage: rule.invitationMessage,
  allowEdits: rule.allowEdits,
  deadline: rule.deadline,
  expirationDate: rule.expirationDate,
  status: rule.status,
});

function getRecipientDisplayValue(
  rule: DistributionRule,
  users: AdminUserRecord[],
): string {
  if (rule.recipients === "specific") {
    const count = rule.specificUsers.length;
    if (count === 0) return "Specific Users (0)";
    const names = rule.specificUsers
      .map((id) => users.find((u) => u._id === id)?.username)
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");
    const rest = count > 2 ? ` +${count - 2} more` : "";
    return `${names}${rest}`;
  }
  return recipientLabel[rule.recipients] || rule.recipients;
}

export default function FormDistributionPage() {
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [editingRule, setEditingRule] = useState<DistributionRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<DistributionRule | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [sameDayMode, setSameDayMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingToggle, setConfirmingToggle] =
    useState<DistributionRule | null>(null);
  const [sendingRule, setSendingRule] = useState<DistributionRule | null>(null);
  const [forms, setForms] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [monthCalendarOpen, setMonthCalendarOpen] = useState<number | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeHourText, setTimeHourText] = useState("08");
  const [timeMinuteText, setTimeMinuteText] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [timeMode, setTimeMode] = useState<"hour" | "minute">("hour");

  const formOptions: MultiSelectOption[] = useMemo(
    () => forms.map((f) => ({ value: f, label: f })),
    [forms],
  );

  const projectOptions: MultiSelectOption[] = useMemo(
    () => projects.map((p) => ({ value: p.name, label: p.name })),
    [projects],
  );

  const userOptions: MultiSelectOption[] = useMemo(
    () => users.map((u) => ({ value: u._id, label: u.username })),
    [users],
  );

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/form-distribution");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load rules.");
      }
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rules.");
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
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!timeOpen) return;
    const t = draft.scheduleConfig.time ?? "08:00";
    const [hStr, mStr] = t.split(":");
    const h = Number(hStr);
    setTimeHourText(String(h % 12 || 12).padStart(2, "0"));
    setTimeMinuteText(mStr.padStart(2, "0"));
    setTimePeriod(h >= 12 ? "PM" : "AM");
  }, [timeOpen]);

  const fetchForms = useCallback(async () => {
    try {
      const response = await fetch("/api/form-configs");
      if (response.ok) {
        const data = await response.json();

        const titlesRaw = data["form-titles"];
        if (titlesRaw) {
          const titles = JSON.parse(titlesRaw) as Record<string, string>;
          setForms(Object.values(titles));
          return;
        }

        const configsRaw = data["project-form-configs"];
        if (configsRaw) {
          const configs = JSON.parse(configsRaw) as Record<string, unknown>;
          setForms(Object.keys(configs));
          return;
        }
      }

      const projRes = await fetch("/api/projects");
      if (projRes.ok) {
        const projData = await projRes.json();
        const names: string[] = (projData.projects || []).map(
          (p: { id: string; name: string }) => p.name,
        );
        setForms(names);
      }
    } catch {
      // non-critical
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchProjects();
    fetchForms();
    fetchUsers();
  }, [fetchRules, fetchProjects, fetchForms, fetchUsers]);

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      rule.projects.some((p) =>
        p.toLowerCase().includes(searchValue.toLowerCase()),
      ),
  );

  const openCreate = () => {
    setEditingRule(null);
    setDraft(emptyDraft);
    setSameDayMode(true);
    setIsDialogOpen(true);
  };

  const openEdit = (rule: DistributionRule) => {
    setEditingRule(rule);
    setDraft(toDraft(rule));
    setSameDayMode(!rule.scheduleConfig.monthDays);
    setIsDialogOpen(true);
  };

  const getScheduleDescription = (rule: DistributionRule): string => {
    const base = scheduleLabel[rule.scheduleType];
    if (rule.scheduleType === "monthly" && rule.scheduleConfig.day) {
      return `Monthly (day ${rule.scheduleConfig.day})`;
    }
    if (
      rule.scheduleType === "quarterly" &&
      rule.scheduleConfig.months?.length
    ) {
      const days = rule.scheduleConfig.monthDays;
      if (days && Object.keys(days).length > 0) {
        const parts = rule.scheduleConfig.months.map((m) => {
          const d = days[m] ?? rule.scheduleConfig.day ?? 1;
          return `${MONTHS[m - 1]} (day ${d})`;
        });
        return `Quarterly (${parts.join(", ")})`;
      }
      const names = rule.scheduleConfig.months
        .map((m) => MONTHS[m - 1])
        .join(", ");
      const day = rule.scheduleConfig.day ?? 1;
      return `Quarterly (${names}, day ${day})`;
    }
    if (rule.scheduleType === "custom" && rule.scheduleConfig.date) {
      return `Custom (${formatDate(rule.scheduleConfig.date)})`;
    }
    return base;
  };

  const save = async () => {
    const name = draft.name.trim();
    setValidationError("");

    if (!name) {
      setValidationError("Automation name is required.");
      return;
    }
    if (draft.projects.length === 0) {
      setValidationError("Select at least one project.");
      return;
    }
    if (
      draft.recipients === "specific" &&
      draft.specificUsers.length === 0
    ) {
      setValidationError("Select at least one specific user.");
      return;
    }
    if (
      !draft.scheduleConfig.months ||
      draft.scheduleConfig.months.length === 0
    ) {
      setValidationError("Select at least one month.");
      return;
    }

    setSaving(true);

    try {
      setError("");

      if (editingRule) {
        const response = await fetch("/api/form-distribution", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingRule.id,
            name,
            projects: draft.projects,
            forms: draft.forms,
            recipients: draft.recipients,
            specificUsers: draft.specificUsers,
            scheduleType: draft.scheduleType,
            scheduleConfig: draft.scheduleConfig,
            emailSubject: draft.emailSubject,
            customMessage: draft.customMessage,
            invitationMessage: draft.invitationMessage,
            allowEdits: draft.allowEdits,
            deadline: draft.deadline,
            expirationDate: draft.expirationDate,
            status: draft.status,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update rule.");
        }
      } else {
        const response = await fetch("/api/form-distribution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            projects: draft.projects,
            forms: draft.forms,
            recipients: draft.recipients,
            specificUsers: draft.specificUsers,
            scheduleType: draft.scheduleType,
            scheduleConfig: draft.scheduleConfig,
            emailSubject: draft.emailSubject,
            customMessage: draft.customMessage,
            invitationMessage: draft.invitationMessage,
            allowEdits: draft.allowEdits,
            deadline: draft.deadline,
            expirationDate: draft.expirationDate,
            status: draft.status,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to create rule.");
        }
      }

      setIsDialogOpen(false);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async () => {
    if (!deletingRule || saving) return;

    setSaving(true);
    try {
      setError("");
      const response = await fetch("/api/form-distribution", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingRule.id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete rule.");
      }
      setDeletingRule(null);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule.");
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleStatus = async () => {
    const rule = confirmingToggle;
    if (!rule || saving) return;

    const newStatus: RuleStatus =
      rule.status === "active" ? "paused" : "active";
    setSaving(true);
    try {
      const response = await fetch("/api/form-distribution", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update status.");
      }
      setConfirmingToggle(null);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    const rule = sendingRule;
    if (!rule || saving) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/form-distribution/send-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: rule.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send.");
      }
      setSendingRule(null);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <PageHeader
        title="Form Automation"
        subtitle="Schedule automated form link emails to coordinators, facilitators, or specific users"
        action={
          <Button
            onClick={openCreate}
            className="bg-[#2563EB] hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Automation
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search by automation name or project..."
      />

      {loading ? (
        <div className="animate-pulse mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <div className="bg-slate-50 p-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border-t border-slate-100">
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          {rules.length === 0
            ? "No automations yet. Create one to get started."
            : "No automations match your search."}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Projects
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Recipients
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Schedule
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Next Send
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {rule.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-50 truncate">
                    {rule.projects.join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {getRecipientDisplayValue(rule, users)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {getScheduleDescription(rule)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(rule.nextSendAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-xl px-2 py-0.5 text-xs font-medium ${statusBadge[rule.status].class}`}
                    >
                      {statusBadge[rule.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(rule)}
                        className="rounded-xl p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmingToggle(rule)}
                        className="rounded-xl p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title={rule.status === "active" ? "Pause" : "Activate"}
                      >
                        {rule.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setSendingRule(rule)}
                        className="rounded-xl p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Send Now"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingRule(rule)}
                        className="rounded-xl p-1 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
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
        Showing {filteredRules.length} of {rules.length} automation
        {rules.length !== 1 ? "s" : ""}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Automation" : "Create Automation"}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Update the automation details below."
                : "Set up an automated email schedule for form links."}
            </DialogDescription>
          </DialogHeader>
          {validationError && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {validationError}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {/* Automation Details */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Automation Details
              </h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Automation Name
                </label>
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  onFocus={(e) => {
                    const value = e.target.value;
                    requestAnimationFrame(() => {
                      e.target.setSelectionRange(value.length, value.length);
                    });
                  }}
                  placeholder="e.g. Q1 Reports"
                />
              </div>
              {editingRule && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <Select
                    value={draft.status}
                    onValueChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        status: value as RuleStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Projects</h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Projects
                </label>
                <MultiSelect
                  options={projectOptions}
                  selected={draft.projects}
                  onChange={(values) =>
                    setDraft((prev) => ({ ...prev, projects: values, forms: values }))
                  }
                  placeholder="Select projects..."
                  searchPlaceholder="Search projects..."
                  emptyMessage="No projects found."
                  disabled={projects.length === 0}
                />
                {projects.length === 0 && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    No projects available. Create a project first.
                  </p>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Recipients
              </h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Send to
                </label>
                <Select
                  value={draft.recipients}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      recipients: value as RecipientType,
                      specificUsers:
                        value !== "specific" ? [] : prev.specificUsers,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">
                      Coordinators & Facilitators
                    </SelectItem>
                    <SelectItem value="coordinators">Coordinators</SelectItem>
                    <SelectItem value="facilitators">Facilitators</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.recipients === "specific" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Select Users
                  </label>
                  <MultiSelect
                    options={userOptions}
                    selected={draft.specificUsers}
                    onChange={(values) =>
                      setDraft((prev) => ({ ...prev, specificUsers: values }))
                    }
                    placeholder="Search and select users..."
                    searchPlaceholder="Search by username..."
                    emptyMessage="No users found."
                    disabled={users.length === 0}
                  />
                  {users.length === 0 && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      No users available.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Schedule</h3>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Months
                </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Select the months to send each quarter.
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2">
                    {MONTHS.map((month, idx) => {
                      const monthNum = idx + 1;
                      const checked =
                        draft.scheduleConfig.months?.includes(monthNum) ??
                        false;
                      return (
                        <label
                          key={month}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setDraft((prev) => {
                                const current =
                                  prev.scheduleConfig.months || [];
                                const updated = checked
                                  ? current.filter((m) => m !== monthNum)
                                  : [...current, monthNum].sort(
                                      (a, b) => a - b,
                                    );
                                const monthDays = prev.scheduleConfig.monthDays
                                  ? { ...prev.scheduleConfig.monthDays }
                                  : undefined;
                                if (monthDays) {
                                  if (checked) {
                                    delete monthDays[monthNum];
                                  } else {
                                    monthDays[monthNum] =
                                      prev.scheduleConfig.day ?? 1;
                                  }
                                }
                                return {
                                  ...prev,
                                  scheduleConfig: {
                                    ...prev.scheduleConfig,
                                    months: updated,
                                    monthDays,
                                  },
                                };
                              })
                            }
                            className="rounded border-slate-300"
                          />
                          {month.substring(0, 3)}
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Day of month
                    </label>

                    <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSameDayMode(true);
                          setDraft((prev) => ({
                            ...prev,
                            scheduleConfig: {
                              ...prev.scheduleConfig,
                              monthDays: undefined,
                            },
                          }));
                        }}
                        className={cn(
                          "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          sameDayMode
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Same day for all
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSameDayMode(false);
                          setDraft((prev) => {
                            const months =
                              prev.scheduleConfig.months ?? [];
                            const defaultDay =
                              prev.scheduleConfig.day ?? 1;
                            const monthDays: Record<number, number> = {};
                            months.forEach(
                              (m) => (monthDays[m] = defaultDay),
                            );
                            return {
                              ...prev,
                              scheduleConfig: {
                                ...prev.scheduleConfig,
                                monthDays,
                              },
                            };
                          });
                        }}
                        className={cn(
                          "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          !sameDayMode
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Custom per month
                      </button>
                    </div>

                    {sameDayMode ? (
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-xl"
                          >
                            <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
                            <span>
                              {ordinal(draft.scheduleConfig.day ?? 1)} of the month
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              new Date(
                                new Date().getFullYear(),
                                0,
                                draft.scheduleConfig.day ?? 1,
                              )
                            }
                            onSelect={(date) => {
                              if (date) {
                                setDraft((prev) => ({
                                  ...prev,
                                  scheduleConfig: {
                                    ...prev.scheduleConfig,
                                    day: date.getDate(),
                                  },
                                }));
                                setCalendarOpen(false);
                              }
                            }}
                            defaultMonth={new Date()}
                            initialFocus
                            className="rounded-2xl border border-slate-200 bg-white p-3 [&_.rdp-day_selected]:bg-slate-500 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-slate-600 [&_.rdp-day_today]:bg-slate-100 [&_.rdp-day_today]:text-slate-900 [&_.rdp-button:hover]:bg-slate-100 [&_.rdp-button]:rounded-xl [&_.rdp-day]:rounded-xl [&_.rdp-caption_label]:text-slate-800 [&_.rdp-nav_button]:rounded-xl [&_.rdp-nav_button]:border-slate-200"
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="space-y-2">
                        {(draft.scheduleConfig.months ?? []).length ===
                        0 ? (
                          <p className="text-xs text-slate-400">
                            Select months above to set custom days.
                          </p>
                        ) : (
                          (draft.scheduleConfig.months ?? []).map(
                            (monthNum) => (
                              <div
                                key={monthNum}
                                className="flex items-center gap-3"
                              >
                                <span className="w-24 text-sm text-slate-700">
                                  {MONTHS[monthNum - 1]}
                                </span>
                                <Popover
                                  open={monthCalendarOpen === monthNum}
                                  onOpenChange={(open) =>
                                    setMonthCalendarOpen(open ? monthNum : null)
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="justify-start text-left font-normal rounded-xl gap-2"
                                    >
                                      <CalendarDays className="h-4 w-4 text-slate-500 shrink-0" />
                                      <span>
                                        {ordinal(draft.scheduleConfig.monthDays?.[
                                          monthNum
                                        ] ?? 1)} of the month
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={
                                        new Date(
                                          new Date().getFullYear(),
                                          monthNum - 1,
                                          draft.scheduleConfig
                                            .monthDays?.[monthNum] ?? 1,
                                        )
                                      }
                                      onSelect={(date) => {
                                        if (date) {
                                          setDraft((prev) => ({
                                            ...prev,
                                            scheduleConfig: {
                                              ...prev.scheduleConfig,
                                              monthDays: {
                                                ...prev.scheduleConfig
                                                  .monthDays,
                                                [monthNum]:
                                                  date.getDate(),
                                              },
                                            },
                                          }));
                                          setMonthCalendarOpen(null);
                                        }
                                      }}
                                      defaultMonth={
                                        new Date(new Date().getFullYear(), monthNum - 1)
                                      }
                                      initialFocus
                                      className="rounded-2xl border border-slate-200 bg-white p-3 [&_.rdp-day_selected]:bg-slate-500 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-slate-600 [&_.rdp-day_today]:bg-slate-100 [&_.rdp-day_today]:text-slate-900 [&_.rdp-button:hover]:bg-slate-100 [&_.rdp-button]:rounded-xl [&_.rdp-day]:rounded-xl [&_.rdp-caption_label]:text-slate-800 [&_.rdp-nav_button]:rounded-xl [&_.rdp-nav_button]:border-slate-200"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ),
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Set time
                      </label>
                      <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-xl"
                          >
                            <Clock className="mr-2 h-4 w-4 text-slate-500" />
                            <span>
                              {formatTime(draft.scheduleConfig.time ?? "08:00")}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-xl"
                          align="start"
                        >
                          <div className="flex flex-col gap-4 p-3 w-[270px]">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTimeMode("hour")}
                                className={`text-4xl font-medium transition-colors ${
                                  timeMode === "hour"
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {timeHourText}
                              </button>

                              <span className="text-4xl text-slate-400">:</span>

                              <button
                                type="button"
                                onClick={() => setTimeMode("minute")}
                                className={`text-4xl font-medium transition-colors ${
                                  timeMode === "minute"
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {timeMinuteText}
                              </button>

                              <div className="ml-3 flex flex-col rounded-xl border border-slate-200 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setTimePeriod("AM")}
                                  className={`px-3 py-1.5 text-xs font-medium ${
                                    timePeriod === "AM"
                                      ? "bg-slate-500 text-white"
                                      : "bg-white text-slate-600"
                                  }`}
                                >
                                  AM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTimePeriod("PM")}
                                  className={`px-3 py-1.5 text-xs font-medium ${
                                    timePeriod === "PM"
                                      ? "bg-slate-500 text-white"
                                      : "bg-white text-slate-600"
                                  }`}
                                >
                                  PM
                                </button>
                              </div>
                            </div>

                            <div className="relative mx-auto h-[190px] w-[190px] rounded-full bg-slate-100">
                              {(timeMode === "hour"
                                ? [...Array(12)].map((_, i) => ({
                                    label: i === 0 ? "12" : String(i),
                                    value: i === 0 ? "12" : String(i).padStart(2, "0"),
                                  }))
                                : [...Array(12)].map((_, i) => ({
                                    label: String(i * 5).padStart(2, "0"),
                                    value: String(i * 5).padStart(2, "0"),
                                  }))
                              ).map((item, i) => {
                                const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
                                const x = 95 + 64 * Math.cos(angle);
                                const y = 95 + 64 * Math.sin(angle);
                                const selected =
                                  timeMode === "hour"
                                    ? timeHourText === item.value
                                    : timeMinuteText === item.value;

                                return (
                                  <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                      if (timeMode === "hour") {
                                        setTimeHourText(item.value);
                                        setTimeMode("minute");
                                      } else {
                                        setTimeMinuteText(item.value);
                                      }
                                    }}
                                    className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-medium transition-all ${
                                      selected
                                        ? "bg-slate-500 text-white shadow-md"
                                        : "text-slate-700 hover:bg-slate-200"
                                    }`}
                                    style={{ left: `${x}px`, top: `${y}px` }}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const h12 = Math.max(1, Math.min(12, Number(timeHourText) || 1));
                                  const m = Math.max(0, Math.min(59, Number(timeMinuteText) || 0));
                                  const h24 =
                                    timePeriod === "PM"
                                      ? (h12 % 12) + 12
                                      : h12 % 12;

                                  setDraft((prev) => ({
                                    ...prev,
                                    scheduleConfig: {
                                      ...prev.scheduleConfig,
                                      time: `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
                                    },
                                  }));

                                  setTimeOpen(false);
                                }}
                                className="rounded-xl bg-slate-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Email Settings
              </h3>
              <p className="text-xs text-slate-500">
                These settings control how the email invitation appears when
                recipients receive the form link.
              </p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  This becomes the email subject line recipients see.
                </p>
                <Input
                  value={draft.emailSubject}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      emailSubject: e.target.value,
                    }))
                  }
                  placeholder="e.g. Quarterly Report Submission Request"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Custom Message
                </label>
                <Textarea
                  value={draft.customMessage}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      customMessage: e.target.value,
                    }))
                  }
                  placeholder="Optional custom message for the email body"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Invitation Message
                </label>
                <Textarea
                  value={draft.invitationMessage}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      invitationMessage: e.target.value,
                    }))
                  }
                  placeholder="Optional invitation message"
                  rows={2}
                />
              </div>
            </div>

            {/* Link Settings */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Link Settings
              </h3>
              <p className="text-xs text-slate-500">
                Control how recipients can use the form link after it is sent.
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.allowEdits}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      allowEdits: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                Allow edits after submission
              </label>
              <p className="text-xs text-slate-500">
                Recipients can reopen the form later and modify their submitted
                response.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Deadline */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Deadline
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Last date/time when submissions are accepted.
                  </p>
                  <div className="space-y-2">
                    {/* Custom Calendar for Deadline Date */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start rounded-xl font-normal">
                          <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
                          {draft.deadline
                            ? new Date(draft.deadline).toLocaleDateString("en-GB")
                            : "Select deadline date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={draft.deadline ? new Date(draft.deadline) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setDraft((prev) => ({
                                ...prev,
                                deadline: date.toISOString().split("T")[0],
                              }));
                            }
                          }}
                          initialFocus
                          className="rounded-2xl border border-slate-200 bg-white p-3 [&_.rdp-day_selected]:bg-slate-500 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-slate-600 [&_.rdp-day_today]:bg-slate-100 [&_.rdp-day_today]:text-slate-900 [&_.rdp-button:hover]:bg-slate-100 [&_.rdp-button]:rounded-xl [&_.rdp-day]:rounded-xl [&_.rdp-caption_label]:text-slate-800 [&_.rdp-nav_button]:rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                    {/* Custom Clock for Deadline Time (readonly, points to Schedule) */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start rounded-xl font-normal">
                          <Clock className="mr-2 h-4 w-4 text-slate-500" />
                          {formatTime(draft.scheduleConfig.time ?? "08:00")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto rounded-xl" align="start">
                        <div className="flex flex-col gap-4 p-3 w-[270px]">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setTimeMode("hour")}
                              className={`text-4xl font-medium transition-colors ${
                                timeMode === "hour" ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {timeHourText}
                            </button>

                            <span className="text-4xl text-slate-400">:</span>

                            <button
                              type="button"
                              onClick={() => setTimeMode("minute")}
                              className={`text-4xl font-medium transition-colors ${
                                timeMode === "minute" ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {timeMinuteText}
                            </button>

                            <div className="ml-3 flex flex-col rounded-xl border border-slate-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setTimePeriod("AM")}
                                className={`px-3 py-1.5 text-xs font-medium ${
                                  timePeriod === "AM"
                                    ? "bg-slate-500 text-white"
                                    : "bg-white text-slate-600"
                                }`}
                              >AM</button>
                              <button
                                type="button"
                                onClick={() => setTimePeriod("PM")}
                                className={`px-3 py-1.5 text-xs font-medium ${
                                  timePeriod === "PM"
                                    ? "bg-slate-500 text-white"
                                    : "bg-white text-slate-600"
                                }`}
                              >PM</button>
                            </div>
                          </div>

                          <div className="relative mx-auto h-[190px] w-[190px] rounded-full bg-slate-100">
                            {(timeMode === "hour"
                              ? [...Array(12)].map((_, i) => ({
                                  label: i === 0 ? "12" : String(i),
                                  value: i === 0 ? "12" : String(i).padStart(2, "0"),
                                }))
                              : [...Array(12)].map((_, i) => ({
                                  label: String(i * 5).padStart(2, "0"),
                                  value: String(i * 5).padStart(2, "0"),
                                }))
                            ).map((item, i) => {
                              const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
                              const x = 95 + 64 * Math.cos(angle);
                              const y = 95 + 64 * Math.sin(angle);
                              const selected =
                                timeMode === "hour"
                                  ? timeHourText === item.value
                                  : timeMinuteText === item.value;

                              return (
                                <button
                                  key={item.value}
                                  type="button"
                                  onClick={() => {
                                    if (timeMode === "hour") {
                                      setTimeHourText(item.value);
                                      setTimeMode("minute");
                                    } else {
                                      setTimeMinuteText(item.value);
                                    }
                                  }}
                                  className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-medium transition-all ${
                                    selected
                                      ? "bg-slate-500 text-white shadow-md"
                                      : "text-slate-700 hover:bg-slate-200"
                                  }`}
                                  style={{ left: `${x}px`, top: `${y}px` }}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const h12 = Math.max(1, Math.min(12, Number(timeHourText) || 1));
                                const m = Math.max(0, Math.min(59, Number(timeMinuteText) || 0));
                                const h24 =
                                  timePeriod === "PM" ? (h12 % 12) + 12 : h12 % 12;

                                setDraft((prev) => ({
                                  ...prev,
                                  scheduleConfig: {
                                    ...prev.scheduleConfig,
                                    time: `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
                                  },
                                }));
                              }}
                              className="rounded-xl bg-slate-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {/* Expiration Date */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Expiration Date
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    After this date the form link becomes unavailable.
                  </p>
                  <div className="space-y-2">
                    {/* Custom Calendar for Expiration Date */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start rounded-xl font-normal">
                          <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
                          {draft.expirationDate
                            ? new Date(draft.expirationDate).toLocaleDateString("en-GB")
                            : "Select expiration date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={draft.expirationDate ? new Date(draft.expirationDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setDraft((prev) => ({
                                ...prev,
                                expirationDate: date.toISOString().split("T")[0],
                              }));
                            }
                          }}
                          initialFocus
                          className="rounded-2xl border border-slate-200 bg-white p-3 [&_.rdp-day_selected]:bg-slate-500 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-slate-600 [&_.rdp-day_today]:bg-slate-100 [&_.rdp-day_today]:text-slate-900 [&_.rdp-button:hover]:bg-slate-100 [&_.rdp-button]:rounded-xl [&_.rdp-day]:rounded-xl [&_.rdp-caption_label]:text-slate-800 [&_.rdp-nav_button]:rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                    {/* Custom Clock for Expiration Time (readonly, points to Schedule) */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start rounded-xl font-normal">
                          <Clock className="mr-2 h-4 w-4 text-slate-500" />
                          {formatTime(draft.scheduleConfig.time ?? "08:00")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto rounded-xl" align="start">
                        <div className="flex flex-col gap-4 p-3 w-[270px]">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setTimeMode("hour")}
                              className={`text-4xl font-medium transition-colors ${
                                timeMode === "hour" ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {timeHourText}
                            </button>

                            <span className="text-4xl text-slate-400">:</span>

                            <button
                              type="button"
                              onClick={() => setTimeMode("minute")}
                              className={`text-4xl font-medium transition-colors ${
                                timeMode === "minute" ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {timeMinuteText}
                            </button>

                            <div className="ml-3 flex flex-col rounded-xl border border-slate-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setTimePeriod("AM")}
                                className={`px-3 py-1.5 text-xs font-medium ${
                                  timePeriod === "AM"
                                    ? "bg-slate-500 text-white"
                                    : "bg-white text-slate-600"
                                }`}
                              >AM</button>
                              <button
                                type="button"
                                onClick={() => setTimePeriod("PM")}
                                className={`px-3 py-1.5 text-xs font-medium ${
                                  timePeriod === "PM"
                                    ? "bg-slate-500 text-white"
                                    : "bg-white text-slate-600"
                                }`}
                              >PM</button>
                            </div>
                          </div>

                          <div className="relative mx-auto h-[190px] w-[190px] rounded-full bg-slate-100">
                            {(timeMode === "hour"
                              ? [...Array(12)].map((_, i) => ({
                                  label: i === 0 ? "12" : String(i),
                                  value: i === 0 ? "12" : String(i).padStart(2, "0"),
                                }))
                              : [...Array(12)].map((_, i) => ({
                                  label: String(i * 5).padStart(2, "0"),
                                  value: String(i * 5).padStart(2, "0"),
                                }))
                            ).map((item, i) => {
                              const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
                              const x = 95 + 64 * Math.cos(angle);
                              const y = 95 + 64 * Math.sin(angle);
                              const selected =
                                timeMode === "hour"
                                  ? timeHourText === item.value
                                  : timeMinuteText === item.value;

                              return (
                                <button
                                  key={item.value}
                                  type="button"
                                  onClick={() => {
                                    if (timeMode === "hour") {
                                      setTimeHourText(item.value);
                                      setTimeMode("minute");
                                    } else {
                                      setTimeMinuteText(item.value);
                                    }
                                  }}
                                  className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-medium transition-all ${
                                    selected
                                      ? "bg-slate-500 text-white shadow-md"
                                      : "text-slate-700 hover:bg-slate-200"
                                  }`}
                                  style={{ left: `${x}px`, top: `${y}px` }}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const h12 = Math.max(1, Math.min(12, Number(timeHourText) || 1));
                                const m = Math.max(0, Math.min(59, Number(timeMinuteText) || 0));
                                const h24 =
                                  timePeriod === "PM" ? (h12 % 12) + 12 : h12 % 12;

                                setDraft((prev) => ({
                                  ...prev,
                                  scheduleConfig: {
                                    ...prev.scheduleConfig,
                                    time: `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
                                  },
                                }));
                              }}
                              className="rounded-xl bg-slate-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <style jsx>{`
            input[type="date"],
            input[type="time"] {
              color-scheme: light;
              accent-color: #6b7280;
            }

            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator {
              filter: grayscale(1) opacity(0.75);
            }
          `}</style>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving..." : editingRule ? "Save Changes" : "Create Automation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingRule)}
        onOpenChange={(open) => !open && setDeletingRule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation</DialogTitle>
            <DialogDescription>
              Delete <strong>{deletingRule?.name}</strong>? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingRule(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteRule()}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmingToggle)}
        onOpenChange={(open) => !open && setConfirmingToggle(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmingToggle?.status === "active"
                ? "Pause Automation"
                : "Activate Automation"}
            </DialogTitle>
            <DialogDescription>
              {confirmingToggle?.status === "active"
                ? `Pausing "${confirmingToggle?.name}" will stop scheduled sends until it is reactivated.`
                : `Activating "${confirmingToggle?.name}" will resume scheduled sends.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmingToggle(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant={confirmingToggle?.status === "active" ? "destructive" : "default"}
              onClick={() => void confirmToggleStatus()}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : confirmingToggle?.status === "active"
                  ? "Pause"
                  : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(sendingRule)}
        onOpenChange={(open) => !open && setSendingRule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Now</DialogTitle>
            <DialogDescription>
              Immediately execute "{sendingRule?.name}" and send emails to all
              matching recipients now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendingRule(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSendNow()}
              disabled={saving}
            >
              {saving ? "Sending..." : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
