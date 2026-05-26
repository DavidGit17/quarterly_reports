"use client";

import { useEffect, useState } from "react";
import { Menu, Search, Bell, LogOut, Check, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    message:
      "Annual Sustainability Report (Spanish) is pending your approval",
    timestamp: "2024-02-20T10:30:00",
    read: false,
    actionUrl: "/dashboard/reports",
  },
  {
    id: "2",
    type: "report",
    title: "New Report Submitted",
    message:
      "Financial Performance Analysis report submitted by Michael Chen",
    timestamp: "2024-02-20T09:15:00",
    read: false,
  },
  {
    id: "3",
    type: "approval",
    title: "Approval Pending",
    message:
      "Operational Excellence Initiative report awaiting your review",
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

const typeColors: Record<string, { dot: string; bg: string; label: string }> =
  {
    approval: {
      dot: "bg-[#d68a3c]",
      bg: "bg-[#fdf1e6] text-[#8a5a1e]",
      label: "Approval",
    },
    report: {
      dot: "bg-[#555f6d]",
      bg: "bg-[#edeeef] text-[#424845]",
      label: "Report",
    },
    alert: {
      dot: "bg-[#ba1a1a]",
      bg: "bg-[#ffdad6] text-[#93000a]",
      label: "Alert",
    },
    system: {
      dot: "bg-[#727974]",
      bg: "bg-[#edeeef] text-[#424845]",
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
    <header className="sticky top-0 z-40 border-b border-[#c2c8c3] bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-10">
        {/* Left: Mobile menu and search */}
        <div className="flex items-center gap-4 flex-1 md:flex-none">
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 hover:bg-[#f3f4f5] rounded transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-[#555f6d]" />
          </button>

          {/* Desktop search */}
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#727974]" />
            <Input
              type="search"
              placeholder="Search reports..."
              className="rounded border-[#c2c8c3] bg-[#f3f4f5] pl-10 pr-4 text-[#191c1d] placeholder:text-[#727974] focus-visible:ring-[#b2cdbf]/60"
            />
          </div>
        </div>

        {/* Right: Title (mobile) and actions */}
        <div className="md:hidden flex-1 text-center">
          <h2 className="text-sm font-semibold text-[#191c1d]">Reports</h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="relative p-2 hover:bg-[#f3f4f5] rounded transition-colors">
                <Bell className="w-5 h-5 text-[#555f6d]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#ba1a1a] text-white text-[11px] font-semibold leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-[400px] p-0 border-[#c2c8c3] rounded-xl shadow-[0_4px_12px_rgba(90,100,114,0.08)] bg-white overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#c2c8c3]">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-[16px] font-semibold leading-6 text-[#191c1d]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#4b6358] text-white text-[11px] font-semibold leading-none font-ui">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium text-[#555f6d] hover:text-[#344b41] hover:bg-[#f3f4f5] transition-colors font-ui"
                    >
                      <Check className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium text-[#ba1a1a] hover:text-[#93000a] hover:bg-[#ffdad6] transition-colors font-ui"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-[#e7e8e9]">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-5 py-4 transition-colors ${
                          n.read ? "bg-white" : "bg-[#f8f9fa]"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Type indicator */}
                          <div className="mt-1.5 flex-shrink-0">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                typeColors[n.type]?.dot || "bg-[#727974]"
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-ui text-[14px] font-semibold leading-5 text-[#191c1d]">
                                    {n.title}
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-none font-ui ${
                                      typeColors[n.type]?.bg ||
                                      "bg-[#edeeef] text-[#424845]"
                                    }`}
                                  >
                                    {typeColors[n.type]?.label || "Notification"}
                                  </span>
                                </div>
                                <p className="font-ui text-[13px] leading-[18px] text-[#424845] mt-0.5">
                                  {n.message}
                                </p>
                                <p className="font-data text-[11px] leading-4 text-[#727974] mt-1.5">
                                  {formatIsoDateTime(n.timestamp)}
                                </p>
                                {n.actionUrl && (
                                  <button
                                    onClick={() => {
                                      handleMarkAsRead(n.id);
                                      router.push(n.actionUrl!);
                                      setOpen(false);
                                    }}
                                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#c2c8c3] bg-white text-[12px] font-medium text-[#555f6d] hover:bg-[#f3f4f5] hover:text-[#344b41] transition-colors font-ui"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Open
                                  </button>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-0.5 flex-shrink-0">
                                {!n.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(n.id)}
                                    className="p-1 rounded text-[#727974] hover:text-[#4b6358] hover:bg-[#cee9db]/30 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(n.id)}
                                  className="p-1 rounded text-[#727974] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition-colors"
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
                    <Bell className="w-8 h-8 text-[#c2c8c3] mx-auto mb-3" />
                    <p className="font-ui text-[14px] leading-5 text-[#727974]">
                      No notifications yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#c2c8c3] px-5 py-3">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center font-ui text-[13px] font-medium leading-5 text-[#4b6358] hover:text-[#344b41] transition-colors"
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
                <button className="p-1 hover:bg-[#f3f4f5] rounded transition-colors">
                  <Avatar className="w-8 h-8 border border-[#c2c8c3]">
                    {user.profileImage ? (
                      <AvatarImage src={user.profileImage} alt={user.username} />
                    ) : null}
                    <AvatarFallback className="bg-[#e1e3e4] font-ui text-[13px] font-semibold text-[#344b41]">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="font-ui text-[14px] font-medium text-[#191c1d]">
                    {user.username}
                  </p>
                  <p className="font-ui text-[12px] text-[#727974]">
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

      {/* Mobile search bar */}
      <div className="md:hidden border-t border-[#c2c8c3] px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#727974]" />
          <Input
            type="search"
            placeholder="Search reports..."
            className="w-full rounded border-[#c2c8c3] bg-[#f3f4f5] pl-10 pr-4 text-[#191c1d] placeholder:text-[#727974] focus-visible:ring-[#b2cdbf]/60"
          />
        </div>
      </div>
    </header>
  );
}
