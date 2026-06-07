"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Header } from "./header";
import { Sidebar, sidebarItems } from "./sidebar";
import { AuthProvider } from "./auth-context";
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
    <AuthProvider>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-64 border-r border-slate-200 bg-white p-0 [&>button]:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div className="flex items-center gap-2">
              <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-8 w-auto" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <nav className="space-y-1.5 p-3">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-50 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex h-screen bg-background overflow-hidden">
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
              sidebarOpen ? "md:ml-64" : "md:ml-16",
            )}
          >
            <div className="mx-auto max-w-7xl w-full p-4 md:px-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
