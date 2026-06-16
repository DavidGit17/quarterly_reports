"use client";

import { Clock, CheckCircle2, AlertTriangle, Pencil, Lock } from "lucide-react";
import { cn } from "@/lib/shared/utils";

export type ReportStatus = "pending" | "submitted" | "overdue" | "editing-allowed" | "editing-closed";

const statusConfig: Record<ReportStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  submitted: {
    label: "Submitted",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  "editing-allowed": {
    label: "Editing Allowed",
    icon: Pencil,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "editing-closed": {
    label: "Editing Closed",
    icon: Lock,
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0",
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
