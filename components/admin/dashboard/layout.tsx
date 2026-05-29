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
        <div className="fixed top-0 left-0 right-0 z-50">
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
