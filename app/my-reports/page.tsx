"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/form-storage";

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

export default function MyReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<ReportSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/select" className="text-secondary hover:underline">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-primary">My Reports</h1>
          </div>
          <Link
            href="/select"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors font-medium"
          >
            + New Report
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <input
            type="text"
            placeholder="Search by project or quarter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          />
        </div>

        {errorMessage && (
          <div className="bg-white rounded-lg border border-border p-4 mb-6">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {filteredReports.length > 0 ? (
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Quarter
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Time
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
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
                        className="border-b border-border hover:bg-muted transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-foreground">
                          {report.projectName}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {report.quarter}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {date}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {time}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => router.push(`/report/${report.id}`)}
                            className="text-secondary hover:underline font-medium text-sm"
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
          <div className="bg-white rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No reports found matching your search.
            </p>
            <Link
              href="/select"
              className="text-secondary hover:underline font-medium"
            >
              Create your first report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
