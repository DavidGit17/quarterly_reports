"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime, toProjectSlug } from "@/lib/shared/form-storage";
import { getCurrentUser } from "@/lib/shared/auth-client";

type ReportSubmission = {
  id: string;
  projectName: string;
  quarter: string;
  createdAt: string;
};

type MyReportsResponse = {
  reports?: ReportSubmission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

type MeResponse = {
  user?: {
    role: "admin" | "coordinator";
    project?: string;
  };
};

export default function MyReportsPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reports, setReports] = useState<ReportSubmission[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [formHref, setFormHref] = useState("/auth");

  const loadReports = useCallback(async () => {
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
      if (currentUser.project) {
        setFormHref(`/form/${toProjectSlug(currentUser.project)}`);
      }

      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "50");
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await fetch(`/api/my-reports?${params.toString()}`, { cache: "no-store" });

      if (response.status === 401) {
        router.push("/auth");
        return;
      }

      if (response.status === 403) {
        router.push("/dashboard");
        return;
      }

      const data = (await response.json()) as MyReportsResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Unable to load reports.");
        return;
      }

      setReports(data.reports || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch {
      setErrorMessage("Unable to load reports right now.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, router]);

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setIsLoading(true);
    void loadReports();
  }, [loadReports]);

  if (isLoading) {
    return (
    <div className="coordinator-system min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="mb-8">
            <div className="h-4 w-16 bg-slate-200 rounded mb-3" />
            <div className="flex items-center justify-between gap-4">
              <div className="h-8 w-36 bg-slate-200 rounded" />
              <div className="h-10 w-28 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="si-surface p-6 mb-6">
            <div className="h-10 w-full bg-slate-200 rounded" />
          </div>
          <div className="si-surface overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b border-border">
                <div className="h-4 w-full bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="coordinator-system min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.replace(formHref);
                }
              }}
              className="font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-primary"
            >
              ← Back
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-heading text-[30px] font-semibold leading-10 tracking-[-0.02em] text-foreground">
              My Reports
            </h1>
            <Link
              href={formHref}
              className="si-primary-action px-6 py-2 font-ui text-[14px] font-semibold leading-5"
            >
              + New Report
            </Link>
          </div>
        </div>

        <div className="si-surface p-6 mb-6">
          <input
            type="text"
            placeholder="Search by quarter..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="si-field w-full px-4 py-2 font-ui text-[14px] leading-5 placeholder:text-muted-foreground"
          />
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-[#ffdad6] bg-[#ffdad6]/50 p-4">
            <p className="font-ui text-[14px] leading-5 text-[#93000a]">
              {errorMessage}
            </p>
          </div>
        )}

        {reports.length > 0 ? (
          <div className="si-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-[var(--surface-container-low)]">
                    <th className="px-6 py-4 text-left font-ui text-[12px] font-semibold uppercase tracking-wide text-[#424845]">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left font-ui text-[12px] font-semibold uppercase tracking-wide text-[#424845]">
                      Quarter
                    </th>
                    <th className="px-6 py-4 text-left font-ui text-[12px] font-semibold uppercase tracking-wide text-[#424845]">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left font-ui text-[12px] font-semibold uppercase tracking-wide text-[#424845]">
                      Time
                    </th>
                    <th className="px-6 py-4 text-center font-ui text-[12px] font-semibold uppercase tracking-wide text-[#424845]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const { date, time } = formatDateTime(report.createdAt);

                    return (
                      <tr
                        key={report.id}
                        className="border-b border-border transition-colors hover:bg-[#cee9db]/25"
                      >
                        <td className="px-6 py-4 font-ui text-[14px] leading-5 text-foreground">
                          {report.projectName}
                        </td>
                        <td className="px-6 py-4 font-ui text-[14px] leading-5 text-foreground">
                          {report.quarter}
                        </td>
                        <td className="px-6 py-4 font-data text-[13px] leading-[18px] text-foreground">
                          {date}
                        </td>
                        <td className="px-6 py-4 font-data text-[13px] leading-[18px] text-foreground">
                          {time}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => router.push(`/report/${report.id}`)}
                            className="font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-primary"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="font-data text-[12px] font-medium leading-4 text-[#424845]">
                  {pagination.total} report{pagination.total !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="min-w-[44px] min-h-[44px] p-3 font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-primary disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-data text-[12px] font-medium leading-4 text-[#424845]">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="min-w-[44px] min-h-[44px] p-3 font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-primary disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="si-surface p-12 text-center">
            <p className="mb-4 font-ui text-[14px] leading-5 text-muted-foreground">
              No reports found matching your search.
            </p>
            <Link
              href={formHref}
              className="font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-primary"
            >
              Create your first report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
