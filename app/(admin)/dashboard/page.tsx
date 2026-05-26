"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/shared/form-storage";

interface Report {
  id: string;
  projectName: string;
  quarter: string;
  createdByUsername: string;
  createdAt: string;
}

type ReportsResponse = {
  reports?: Report[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<
    "project" | "quarter" | "date" | "language"
  >("project");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalReportsCount, setTotalReportsCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const reportsResponse = await fetch("/api/reports?page=1&limit=100", {
          cache: "no-store",
        });
        const reportsData = (await reportsResponse.json()) as ReportsResponse;

        if (reportsResponse.status === 401) {
          router.push("/login");
          return;
        }

        if (reportsResponse.status === 403) {
          setIsUnauthorized(true);
          return;
        }

        if (!reportsResponse.ok) {
          setErrorMessage(reportsData.message || "Unable to load reports.");
          return;
        }

        setReports(reportsData.reports || []);
        setTotalReportsCount(reportsData.pagination?.total ?? reportsData.reports?.length ?? 0);
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
      Object.keys(reportData).filter((project) => {
        if (searchType === "project") {
          return project.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchType === "quarter") {
          return Object.keys(reportData[project]).some((quarter) =>
            quarter.toLowerCase().includes(searchTerm.toLowerCase()),
          );
        } else if (searchType === "date") {
          return reportData[project][Object.keys(reportData[project])[0]]?.some(
            (report) =>
              formatDateTime(report.createdAt).date.includes(searchTerm),
          );
        }
        return true;
      }),
    [reportData, searchTerm, searchType],
  );

  const totalProjects = Object.keys(reportData).length;
  const totalReports = totalReportsCount;
  const activeCoordinators = new Set(
    reports.map((report) => report.createdByUsername),
  ).size;

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </>
    );
  }

  if (isUnauthorized) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="bg-white rounded-lg border border-slate-200 p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Access Denied
            </h1>
            <p className="text-slate-600 mb-6">
              You do not have permission to access the admin dashboard. Please
              login with an admin account.
            </p>
            <Link
              href="/login"
              className="text-slate-700 hover:text-slate-800 font-medium"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 text-sm mt-1">
                Welcome back! Here's your quarterly reports overview.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-6 transition-colors">
              <p className="text-sm text-slate-600 mb-2">Total Projects</p>
              <p className="text-3xl font-bold text-slate-900">
                {totalProjects}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 transition-colors">
              <p className="text-sm text-slate-600 mb-2">Total Reports</p>
              <p className="text-3xl font-bold text-slate-900">
                {totalReports}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 transition-colors">
              <p className="text-sm text-slate-600 mb-2">Active Coordinators</p>
              <p className="text-3xl font-bold text-slate-900">
                {activeCoordinators}
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-6">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Unified Search Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder={`Search by ${searchType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-200 bg-white text-slate-900"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) =>
                setSearchType(
                  e.target.value as "project" | "quarter" | "date" | "language",
                )
              }
              className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-200 bg-white text-slate-900"
            >
              <option value="project">Project Name</option>
              <option value="quarter">Quarter</option>
              <option value="date">Date</option>
              <option value="language">Language</option>
            </select>
          </div>
        </div>

        {/* Reports Organized by Project -> Quarter */}
        {filteredProjects.length > 0 ? (
          <div className="space-y-8">
            {filteredProjects.map((project) => (
              <div key={project}>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">
                  {project}
                </h2>

                {Object.keys(reportData[project]).map((quarter) => (
                  <div key={`${project}-${quarter}`} className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 ml-2">
                      {quarter}
                    </h3>

                    <div className="grid gap-4">
                      {reportData[project][quarter].map((report) => (
                        <div
                          key={report.id}
                          className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-600 mb-1">
                                Submitted by:{" "}
                                <span className="text-slate-900 font-medium">
                                  {report.createdByUsername}
                                </span>
                              </p>
                              <p className="text-sm text-slate-600">
                                {formatDateTime(report.createdAt).date} at{" "}
                                {formatDateTime(report.createdAt).time}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                router.push(`/report/${report.id}`)
                              }
                              className="w-full md:w-auto bg-slate-700 text-white px-4 md:px-6 py-2.5 md:py-2 rounded-md hover:bg-slate-800 transition-colors font-medium whitespace-nowrap"
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
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-600">
              {searchTerm
                ? "No projects found matching your search."
                : "No reports available."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
