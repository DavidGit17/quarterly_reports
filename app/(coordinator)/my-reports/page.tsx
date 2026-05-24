"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime, toProjectSlug } from "@/lib/shared/form-storage";

type ReportSubmission = {
  id: string;
  projectName: string;
  quarter: string;
  createdAt: string;
};

type MyReportsResponse = {
  reports?: ReportSubmission[];
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
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<ReportSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [formHref, setFormHref] = useState("/login");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });

        if (!meResponse.ok) {
          router.push("/login");
          return;
        }

        const meData = (await meResponse.json()) as MeResponse;

        if (meData.user?.role !== "coordinator") {
          router.push("/dashboard");
          return;
        }

        if (meData.user.project) {
          setFormHref(`/form/${toProjectSlug(meData.user.project)}`);
        }

        const response = await fetch("/api/my-reports", { cache: "no-store" });

        if (response.status === 401) {
          router.push("/login");
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
      } catch {
        setErrorMessage("Unable to load reports right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadReports();
  }, [router]);

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.quarter.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [reports, searchTerm],
  );

  if (isLoading) {
    return (
      <div className="coordinator-system min-h-screen bg-background flex items-center justify-center">
        <p className="font-ui text-[14px] leading-5 text-muted-foreground">
          Loading reports...
        </p>
      </div>
    );
  }

  return (
    <div className="coordinator-system min-h-screen bg-background">
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
            placeholder="Search by project or quarter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        {filteredReports.length > 0 ? (
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
                  {filteredReports.map((report) => {
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
