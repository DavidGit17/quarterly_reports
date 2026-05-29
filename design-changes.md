"use client";

import { useEffect, useState } from "react";
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
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { user?: SessionUser };
          if (data.user) setUser(data.user);
        }
      } catch {
        // silently fail
      }
    };
    void loadUser();
  }, []);

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
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-semibold text-white">
            QR
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-slate-950 leading-tight">
                Quarterly Reports
              </h1>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-slate-500 leading-tight">
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* Right: Title (mobile) and actions */}
        <div className="md:hidden flex-1 text-center">
          <h2 className="text-sm font-semibold text-slate-900">Reports</h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-100 p-0 border-slate-200 rounded-2xl shadow-lg bg-white overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-[16px] font-semibold leading-6 text-slate-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#2563EB] text-white text-[11px] font-semibold leading-none font-ui">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[12px] font-medium text-slate-500 hover:text-[#2563EB] hover:bg-slate-100 transition-colors font-ui"
                    >
                      <Check className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[12px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-ui"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-105 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-5 py-4 transition-colors ${
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
                                  <p className="font-ui text-[14px] font-semibold leading-5 text-slate-900">
                                    {n.title}
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-none font-ui ${
                                      typeColors[n.type]?.bg ||
                                      "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {typeColors[n.type]?.label ||
                                      "Notification"}
                                  </span>
                                </div>
                                <p className="font-ui text-[13px] leading-4.5 text-slate-600 mt-0.5">
                                  {n.message}
                                </p>
                                <p className="font-data text-[11px] leading-4 text-slate-400 mt-1.5">
                                  {formatIsoDateTime(n.timestamp)}
                                </p>
                                {n.actionUrl && (
                                  <button
                                    onClick={() => {
                                      handleMarkAsRead(n.id);
                                      router.push(n.actionUrl!);
                                      setOpen(false);
                                    }}
                                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-[12px] font-medium text-slate-500 hover:bg-slate-50 hover:text-[#2563EB] transition-colors font-ui"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Open
                                  </button>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-0.5 shrink-0">
                                {!n.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(n.id)}
                                    className="p-1 rounded-xl text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(n.id)}
                                  className="p-1 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="font-ui text-[14px] leading-5 text-slate-400">
                      No notifications yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 px-5 py-3">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center font-ui text-[13px] font-medium leading-5 text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
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
                    <AvatarFallback className="bg-slate-100 font-ui text-[13px] font-semibold text-slate-600">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="font-ui text-[14px] font-medium text-slate-900">
                    {user.username}
                  </p>
                  <p className="font-ui text-[12px] text-slate-400">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
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


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  FolderKanban,
  UserCog,
  Send,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/shared/utils";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: "Forms Overview",
    href: "/dashboard/forms-overview",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: "Form Distribution",
    href: "/dashboard/form-distribution",
    icon: <Send className="w-5 h-5" />,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: <FolderKanban className="w-5 h-5" />,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: <UserCog className="w-5 h-5" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export function Sidebar({
  open = true,
  onToggle,
}: {
  open?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed top-16 bottom-0 left-0 z-40 border-r border-slate-200 bg-white transition-all duration-300 hidden md:flex md:flex-col",
        open ? "w-65" : "w-16",
      )}
    >
      <nav
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          open ? "px-3 py-4" : "px-2 py-4",
        )}
      >
        <div
          className={cn(
            "mb-3 flex items-center",
            open ? "justify-between px-1" : "justify-center",
          )}
        >
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 overflow-hidden whitespace-nowrap transition-all duration-300",
              open ? "opacity-100 max-w-40" : "opacity-0 max-w-0",
            )}
          >
            Navigation
          </span>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            <PanelLeft className={cn("h-4 w-4", open ? "" : "rotate-180")} />
          </button>
        </div>
        <div className="space-y-1.5">
          {sidebarItems.map((item) => {
            let isActive = false;
            if (item.href === "/dashboard") {
              isActive = pathname === "/dashboard";
            } else {
              isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-300",
                  open ? "px-3" : "px-2",
                  isActive
                    ? "bg-slate-50 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
                title={!open ? item.label : undefined}
              >
                {isActive && (
                  <span
                    className={cn(
                      "absolute top-2 bottom-2 w-0.5 rounded-full bg-[#2563EB] transition-all duration-300",
                      open ? "left-0" : "left-1",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "text-slate-900"
                      : "text-slate-500 group-hover:text-slate-700",
                  )}
                >
                  {item.icon}
                </span>
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 flex-1",
                    open ? "opacity-100 max-w-60" : "opacity-0 max-w-0",
                  )}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Header } from "./header";
import { Sidebar, sidebarItems } from "./sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/shared/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#F6F9FC] overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <div
          className={cn(
            "fixed top-0 right-0 z-50 left-0 transition-all duration-300",
            sidebarOpen ? "md:left-65" : "md:left-16",
          )}
        >
          <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
        </div>
        <div
          className={cn(
            "flex-1 overflow-y-auto pt-16 transition-all duration-300",
            sidebarOpen ? "md:ml-65" : "md:ml-16",
          )}
        >
          <div className="w-full p-4 md:px-6 md:py-6">{children}</div>
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-65 border-r border-slate-200 bg-white p-0"
        >
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-semibold text-white">
                QR
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-slate-950">
                  Quarterly Reports
                </h1>
                <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-500">
                  Admin Dashboard
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="ml-auto p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <nav className="flex h-[calc(100dvh-4rem)] flex-col p-3">
            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {sidebarItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-50 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[#2563EB]" />
                    )}
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded transition-colors",
                        isActive
                          ? "text-slate-900"
                          : "text-slate-500 group-hover:text-slate-700",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
