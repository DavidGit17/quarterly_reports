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
    label: "Form Automation",
    href: "/dashboard/form-distribution",
    icon: <Send className="w-5 h-5" />,
  },
  {
    label: "Send History",
    href: "/dashboard/form-distribution/history",
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
        open ? "w-64" : "w-16",
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
              "text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 overflow-hidden whitespace-nowrap transition-all duration-300",
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
            <PanelLeft className={cn("h-4 w-4", open ? "" : "rotate-180")} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-1.5">
          {sidebarItems.map((item) => {
            let isActive = false;
            if (item.href === "/dashboard") {
              isActive = pathname === "/dashboard";
            } else if (item.href === "/dashboard/form-distribution") {
              isActive = pathname === item.href;
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
                      "absolute top-2 bottom-2 w-0.5 rounded-full bg-primary transition-all duration-300",
                      open ? "left-0" : "left-1",
                    )}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "text-slate-900"
                      : "text-slate-500 group-hover:text-slate-700",
                  )}
                  aria-hidden="true"
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
