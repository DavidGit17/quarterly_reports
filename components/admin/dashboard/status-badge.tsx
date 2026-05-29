import { cn } from "@/lib/shared/utils";

interface StatusBadgeProps {
  status:
    | "draft"
    | "submitted"
    | "approval-pending"
    | "approved"
    | "active"
    | "inactive"
    | "pending"
    | "rejected";
  className?: string;
}

const statusStyles: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    label: "Draft",
  },
  submitted: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    label: "Submitted",
  },
  "approval-pending": {
    bg: "bg-orange-100",
    text: "text-orange-800",
    label: "Approval Pending",
  },
  approved: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Approved",
  },
  active: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Active",
  },
  inactive: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    label: "Inactive",
  },
  pending: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    label: "Pending",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Rejected",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-2xl text-xs font-medium",
        style.bg,
        style.text,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
