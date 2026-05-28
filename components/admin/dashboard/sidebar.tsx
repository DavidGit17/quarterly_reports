"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  FolderKanban,
  UserCog,
  CalendarDays,
  Send,
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
    label: "Reporting Cycles",
    href: "/dashboard/reporting-cycles",
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    label: "Email Campaigns",
    href: "/dashboard/email-campaigns",
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 md:z-50 border-r border-slate-200 bg-white">
      {/* Logo */}
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-50 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[#2563EB]" />
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
                <span className="flex-1">{item.label}</span>
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
