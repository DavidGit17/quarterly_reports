"use client";

import { useState } from "react";
import { Menu, Bell, LogOut, Check, Trash2, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatIsoDateTime } from "@/lib/shared/date-format";
import { useAuth } from "./auth-context";

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

interface Notification {
  id: string;
  type: "report" | "approval" | "system" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "coordinator";
  project?: string;
  profileImage?: string;
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "approval",
    title: "Report Approval Required",
    message: "Annual Sustainability Report (Spanish) is pending your approval",
    timestamp: "2024-02-20T10:30:00",
    read: false,
    actionUrl: "/dashboard/reports",
  },
  {
    id: "2",
    type: "report",
    title: "New Report Submitted",
    message: "Financial Performance Analysis report submitted by Michael Chen",
    timestamp: "2024-02-20T09:15:00",
    read: false,
  },
  {
    id: "3",
    type: "approval",
    title: "Approval Pending",
    message: "Operational Excellence Initiative report awaiting your review",
    timestamp: "2024-02-19T14:45:00",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "System Maintenance",
    message:
      "Scheduled maintenance will occur on February 25, 2024 at 2:00 AM UTC",
    timestamp: "2024-02-18T08:00:00",
    read: true,
  },
  {
    id: "5",
    type: "alert",
    title: "High Priority Alert",
    message: "5 reports require immediate attention and approval",
    timestamp: "2024-02-17T16:20:00",
    read: true,
  },
];

const typeColors: Record<string, { dot: string; bg: string; label: string }> = {
  approval: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 text-amber-700",
    label: "Approval",
  },
  report: {
    dot: "bg-slate-500",
    bg: "bg-slate-100 text-slate-600",
    label: "Report",
  },
  alert: {
    dot: "bg-red-500",
    bg: "bg-red-50 text-red-700",
    label: "Alert",
  },
  system: {
    dot: "bg-slate-400",
    bg: "bg-slate-100 text-slate-600",
    label: "System",
  },
};

const getUserInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

export function Header({ onMobileMenuClick }: HeaderProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-3 md:px-4">
        {/* Left: Mobile menu + Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-slate-500" aria-hidden="true" />
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-white">
            QR
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-slate-950 leading-tight">
                Quarterly Reports
              </h1>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-500 leading-tight">
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-slate-500" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-xs font-semibold leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={8}
              avoidCollisions={false}
              className="w-[320px] sm:w-[400px] max-w-[calc(100vw-1rem)] p-0 border-slate-200 rounded-2xl shadow-xl bg-white overflow-hidden !translate-x-[58px] sm:!translate-x-0"
            >
              {/* Header */}
              <div className="flex flex-col gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <h3 className="font-heading text-lg font-semibold leading-6 text-slate-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none font-ui">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex w-full items-center justify-start gap-4 pl-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors font-ui whitespace-nowrap"
                    >
                      <Check className="w-3 h-3" aria-hidden="true" />
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-ui whitespace-nowrap"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-[52vh] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`sm:px-5 px-4 sm:py-4 py-3 transition-colors ${
                          n.read ? "bg-white" : "bg-slate-50"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Type indicator */}
                          <div className="mt-1.5 shrink-0">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                typeColors[n.type]?.dot || "bg-slate-400"
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-ui text-sm font-semibold leading-5 text-slate-900">
                                    {n.title}
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium leading-none font-ui ${
                                      typeColors[n.type]?.bg ||
                                      "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {typeColors[n.type]?.label ||
                                      "Notification"}
                                  </span>
                                </div>
                                <p className="font-ui text-sm leading-4.5 text-slate-600 mt-0.5">
                                  {n.message}
                                </p>
                                <p className="font-data text-xs leading-4 text-slate-400 mt-1.5">
                                  {formatIsoDateTime(n.timestamp)}
                                </p>
                                {n.actionUrl && (
                                  <button
                                    onClick={() => {
                                      handleMarkAsRead(n.id);
                                      router.push(n.actionUrl!);
                                      setOpen(false);
                                    }}
                                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors font-ui"
                                  >
                                    <Eye
                                      className="w-3 h-3"
                                      aria-hidden="true"
                                    />
                                    Open
                                  </button>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-0.5 shrink-0">
                                {!n.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(n.id)}
                                    className="p-1 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors"
                                    aria-label="Mark as read"
                                  >
                                    <Check
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(n.id)}
                                  className="p-1 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  aria-label="Delete notification"
                                >
                                  <Trash2
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sm:px-5 px-4 py-12 text-center">
                    <Bell
                      className="w-8 h-8 text-slate-300 mx-auto mb-3"
                      aria-hidden="true"
                    />
                    <p className="font-ui text-sm leading-5 text-slate-400">
                      No notifications yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 sm:px-5 px-4 py-3">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center font-ui text-sm font-medium leading-5 text-primary hover:text-primary/80 transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-slate-100 rounded-xl transition-colors">
                  <Avatar className="w-8 h-8 border border-slate-200">
                    {user.profileImage ? (
                      <AvatarImage
                        src={user.profileImage}
                        alt={user.username}
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-100 font-ui text-sm font-semibold text-slate-600">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <div className="px-3 py-3 bg-slate-50 rounded-t-2xl">
                  <p className="font-ui text-sm font-semibold text-slate-900">
                    {user.username}
                  </p>
                  <p className="font-ui text-xs text-slate-500 mt-0.5">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="px-3 py-2.5 cursor-pointer font-ui text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100"
                >
                  <Link href="/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="px-3 py-2.5 cursor-pointer text-red-600 font-ui text-sm hover:text-red-700 hover:bg-red-50 focus:bg-red-50 data-[highlighted]:bg-red-50"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
