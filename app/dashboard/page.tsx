"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/form-storage";

interface Report {
  id: string;
  projectName: string;
  quarter: string;
  createdByUsername: string;
  createdAt: string;
}

type MeResponse = {
  user?: {
    role: "admin" | "coordinator";
  };
};

type ReportsResponse = {
  reports?: Report[];
  message?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });

        if (!meResponse.ok) {
          router.push("/login");
          return;
        }

        const meData = (await meResponse.json()) as MeResponse;

        if (meData.user?.role !== "admin") {
          setIsUnauthorized(true);
          return;
        }

        const reportsResponse = await fetch("/api/reports", {
          cache: "no-store",
        });
        const reportsData = (await reportsResponse.json()) as ReportsResponse;

        if (!reportsResponse.ok) {
          setErrorMessage(reportsData.message || "Unable to load reports.");
          return;
        }

        setReports(reportsData.reports || []);
      } catch {
        setErrorMessage("Unable to load dashboard right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [router]);

  const reportData = useMemo(() => {
    const grouped: Record<string, Record<string, Report[]>> = {};

    reports.forEach((report) => {
      const projectName = report.projectName;
      const quarter = report.quarter;

      if (!grouped[projectName]) {
        grouped[projectName] = {};
      }

      if (!grouped[projectName][quarter]) {
        grouped[projectName][quarter] = [];
      }

      grouped[projectName][quarter].push(report);
    });

    return grouped;
  }, [reports]);

  const filteredProjects = useMemo(
    () =>
      Object.keys(reportData).filter((project) =>
        project.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [reportData, searchTerm],
  );

  const totalProjects = Object.keys(reportData).length;
  const totalReports = reports.length;
  const activeCoordinators = new Set(
    reports.map((report) => report.createdByUsername),
  ).size;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-white rounded-lg border border-border p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access the admin dashboard. Please
            login with an admin account.
          </p>
          <Link
            href="/login"
            className="text-secondary hover:underline font-medium"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/form-builder"
              className="text-secondary hover:underline font-medium"
            >
              Form Builder
            </Link>
            <Link
              href="/profile"
              className="text-secondary hover:underline font-medium"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Projects</p>
            <p className="text-3xl font-bold text-primary">{totalProjects}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Reports</p>
            <p className="text-3xl font-bold text-primary">{totalReports}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Active Coordinators
            </p>
            <p className="text-3xl font-bold text-primary">
              {activeCoordinators}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-white rounded-lg border border-border p-4 mb-6">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <input
            type="text"
            placeholder="Search by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          />
        </div>

        {/* Reports Organized by Project -> Quarter */}
        {filteredProjects.length > 0 ? (
          <div className="space-y-8">
            {filteredProjects.map((project) => (
              <div key={project}>
                <h2 className="text-2xl font-bold text-foreground mb-4 pb-4 border-b border-border">
                  {project}
                </h2>

                {Object.keys(reportData[project]).map((quarter) => (
                  <div key={`${project}-${quarter}`} className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 ml-4">
                      {quarter}
                    </h3>

                    <div className="grid gap-4">
                      {reportData[project][quarter].map((report) => (
                        <div
                          key={report.id}
                          className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground mb-1">
                                Submitted by:{" "}
                                <span className="text-foreground font-medium">
                                  {report.createdByUsername}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(report.createdAt).date} at{" "}
                                {formatDateTime(report.createdAt).time}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                router.push(`/report/${report.id}`)
                              }
                              className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium whitespace-nowrap"
                            >
                              View Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm
                ? "No projects found matching your search."
                : "No reports available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
