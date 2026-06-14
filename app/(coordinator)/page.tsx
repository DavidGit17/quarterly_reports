"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  User,
  KeyRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toProjectSlug } from "@/lib/shared/form-storage";
import { getCurrentUser, clearCurrentUserCache } from "@/lib/shared/auth-client";

type MeResponse = {
  user?: {
    role: string;
    project?: string;
    username?: string;
    profileImage?: string;
  };
};

type Report = {
  id: string;
  projectName: string;
  quarter: string;
  createdAt: string;
};

type MyReportsResponse = {
  reports: Report[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
};

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [formHref, setFormHref] = useState("");
  const [isReady, setIsReady] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth");
          return;
        }
        if (currentUser.role !== "coordinator") {
          router.push("/dashboard");
          return;
        }
        setUsername(currentUser.username || "Coordinator");
        setProfileImage(currentUser.profileImage || "");
        if (currentUser.project) {
          setFormHref(`/form/${toProjectSlug(currentUser.project)}`);
        }
        setIsReady(true);
      } catch {
        router.push("/auth");
      }
    };
    void load();
  }, [router]);

  const fetchReports = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search) params.set("search", search);
      const res = await fetch(`/api/my-reports?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as MyReportsResponse;
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) void fetchReports(currentPage, searchValue);
  }, [isReady, currentPage, fetchReports, searchValue]);

  if (!isReady) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#1a1c1e]">
              Welcome, {username}
            </h1>
            <p className="mt-1 text-[15px] text-[#5e6a6e]">
              Quarterly Reports Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/my-reports"
              className="rounded-xl px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              View Reports
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#4b6358]"
                aria-label="Profile menu"
                title="Profile"
              >
                <Avatar className="h-10 w-10 border-2 border-slate-200">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={username} />
                  ) : null}
                  <AvatarFallback className="bg-[#e8f5ee] text-sm font-semibold text-[#4b6358]">
                    {(() => {
                      const parts = username.trim().split(/\s+/);
                      if (!parts[0]) return "U";
                      if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
                      return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-[#1a1c1e]">{username}</p>
                    <p className="text-xs text-[#5e6a6e]">Coordinator</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1c1e] hover:bg-slate-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-[#5e6a6e]" />
                    Profile
                  </Link>
                  <Link
                    href="/profile#password"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1c1e] hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound className="h-4 w-4 text-[#5e6a6e]" />
                    Reset Password
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      clearCurrentUserCache();
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.push("/auth");
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Report Card */}
        <Link
          href={formHref || "/select"}
          className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#cee9db] hover:-translate-y-0.5 mb-8"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8f5ee] text-[#4b6358] group-hover:bg-[#cee9db] transition-colors">
            <FileText className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#1a1c1e]">New Report</h2>
            <p className="text-sm text-[#5e6a6e]">
              Submit a new quarterly report
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#4b6358] transition-colors" />
        </Link>

        {/* My Reports Section */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1c1e]">
                My Reports
              </h2>
              <p className="text-sm text-[#5e6a6e]">
                {pagination.total} report{pagination.total !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by quarter..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a1c1e] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#004446] focus:border-[#004446] transition-colors"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#5e6a6e] mb-3">
                No reports found{searchValue ? " matching your search" : ""}.
              </p>
              {!searchValue && (
                <Link
                  href={formHref || "/select"}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#4b6358] hover:text-[#344b41] transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Submit your first report
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">
                        Project
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">
                        Quarter
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">
                        Time
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#424845]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className="transition-colors hover:bg-[#cee9db]/25"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-[#1a1c1e]">
                          {report.projectName}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#5e6a6e]">
                          {report.quarter}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#5e6a6e]">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#5e6a6e]">
                          {formatTime(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/report/${report.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#4b6358] hover:text-[#344b41] transition-colors"
                          >
                            View
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-xs text-[#424845]">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-slate-200 bg-white min-w-[44px] min-h-[44px] p-3 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(pagination.totalPages, p + 1),
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white min-w-[44px] min-h-[44px] p-3 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
