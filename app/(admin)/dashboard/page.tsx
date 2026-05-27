"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function DashboardPage() {
  const router = useRouter();
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

  const reportsPerProject = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.projectName] = (counts[r.projectName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  const reportsPerMonth = useMemo(() => {
    const counts = new Array(12).fill(0);
    reports.forEach((r) => {
      const month = new Date(r.createdAt).getMonth();
      counts[month]++;
    });
    return counts.map((count, i) => ({ name: MONTHS[i], value: count }));
  }, [reports]);

  const totalProjects = Object.keys(reportData).length;
  const totalReports = totalReportsCount;
  const activeCoordinators = new Set(
    reports.map((report) => report.createdByUsername),
  ).size;

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

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 text-sm mt-1">
                Welcome back! Here's your quarterly reports overview.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-6 transition-colors">
              <p className="text-sm text-slate-600 mb-2">Total Projects</p>
              <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 transition-colors">
              <p className="text-sm text-slate-600 mb-2">Total Reports</p>
              <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 transition-colors">
              <p className="text-sm text-slate-600 mb-2">Active Coordinators</p>
              <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
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

        {/* Charts */}
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reports Per Project */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Reports Per Project
                </h2>
                {reportsPerProject.length > 10 && (
                  <span className="text-xs text-slate-500">
                    showing top {reportsPerProject.length}
                  </span>
                )}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
                <ResponsiveContainer width="100%" height={Math.max(200, reportsPerProject.length * 36)}>
                  <BarChart data={reportsPerProject} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#334155" }} width={120} />
                    <Tooltip
                      contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
                      formatter={(value: number) => [value, "Reports"]}
                    />
                    <Bar dataKey="value" fill="#334155" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reports Per Month */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Reports Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportsPerMonth} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(value: number) => [value, "Reports"]}
                  />
                  <Bar dataKey="value" fill="#334155" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-600">No reports yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
