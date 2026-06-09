"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleUserRound, FileText, ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toProjectSlug } from "@/lib/shared/form-storage";
import { getCurrentUser } from "@/lib/shared/auth-client";

type MeResponse = {
  user?: {
    role: string;
    project?: string;
    username?: string;
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

export default function FacilitatorDashboard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [formHref, setFormHref] = useState("");
  const [isReady, setIsReady] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) { router.push("/auth"); return; }
        if (currentUser.role !== "facilitator") { router.push("/dashboard"); return; }
        setUsername(currentUser.username || "Facilitator");
        if (currentUser.project) {
          setFormHref(`/f/form/${toProjectSlug(currentUser.project)}`);
        }
        setIsReady(true);
      } catch { router.push("/auth"); }
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
      const res = await fetch(`/api/my-reports?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as MyReportsResponse;
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (isReady) void fetchReports(currentPage, searchValue);
  }, [isReady, currentPage, fetchReports, searchValue]);

  if (!isReady) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[#1a1c1e]">
              Welcome, {username}
            </h1>
            <p className="mt-1 text-[15px] text-[#5e6a6e]">
              Quarterly Reports Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/f/my-reports"
              className="py-2 text-sm font-medium text-[#5e6a6e] transition-colors hover:text-[#4b6358]"
            >
              View Reports
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center text-[#5e6a6e] transition-colors hover:text-[#4b6358]"
              aria-label="Go to profile"
              title="Profile"
            >
              <CircleUserRound className="h-10 w-10" />
            </Link>
          </div>
        </div>

        {/* New Report Card */}
        <Link
          href={formHref || "/f/select"}
          className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#cee9db] hover:-translate-y-0.5 mb-8"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8f5ee] text-[#4b6358] group-hover:bg-[#cee9db] transition-colors">
            <FileText className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#1a1c1e]">New Report</h2>
            <p className="text-sm text-[#5e6a6e]">Submit a new quarterly report</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#4b6358] transition-colors" />
        </Link>

        {/* My Reports Section */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1c1e]">My Reports</h2>
              <p className="text-sm text-[#5e6a6e]">{pagination.total} report{pagination.total !== 1 ? "s" : ""}</p>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by quarter..."
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a1c1e] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#cee9db] focus:border-[#4b6358] transition-colors"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="p-6 text-center text-sm text-red-600">{errorMessage}</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#5e6a6e] mb-3">No reports found{searchValue ? " matching your search" : ""}.</p>
              {!searchValue && (
                <Link
                  href={formHref || "/f/select"}
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
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">Project</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">Quarter</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">Time</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#424845]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => (
                      <tr key={report.id} className="transition-colors hover:bg-[#cee9db]/25">
                        <td className="px-6 py-4 text-sm font-medium text-[#1a1c1e]">{report.projectName}</td>
                        <td className="px-6 py-4 text-sm text-[#5e6a6e]">{report.quarter}</td>
                        <td className="px-6 py-4 text-sm text-[#5e6a6e]">{formatDate(report.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-[#5e6a6e]">{formatTime(report.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/f/report/${report.id}`}
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
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
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
