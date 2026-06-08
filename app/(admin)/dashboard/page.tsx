"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/admin/dashboard/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [coordinatorCount, setCoordinatorCount] = useState(0);
  const [facilitatorCount, setFacilitatorCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [reportsResponse, usersResponse, projectsResponse] = await Promise.all([
          fetch("/api/reports?page=1&limit=1", { cache: "no-store" }),
          fetch("/api/admin/users?limit=1", { cache: "no-store" }),
          fetch("/api/projects?countOnly=true", { cache: "no-store" }),
        ]);

        if (reportsResponse.status === 401) {
          router.push("/auth");
          return;
        }

        if (reportsResponse.status === 403) {
          setIsUnauthorized(true);
          return;
        }

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json() as { pagination?: { total: number } };
          setTotalReports(reportsData.pagination?.total ?? 0);
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json() as { counts?: { coordinator: number; facilitator: number } };
          setCoordinatorCount(usersData.counts?.coordinator ?? 0);
          setFacilitatorCount(usersData.counts?.facilitator ?? 0);
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json() as { total?: number };
          setTotalProjects(projectsData.total ?? 0);
        }
      } catch {
        setErrorMessage("Unable to load dashboard right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [router]);

  if (isUnauthorized) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Access Denied
            </h1>
            <p className="text-slate-600 mb-6">
              You do not have permission to access the admin dashboard. Please
              login with an admin account.
            </p>
            <Link
              href="/auth"
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
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <div>
        {/* Header — always rendered for fast LCP */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back{user ? `, ${user.username}` : ""}!
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Here's your quarterly reports overview.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors shadow-sm">
              <p className="text-sm text-slate-600 mb-2">Total Projects</p>
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {totalProjects}
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors shadow-sm">
              <p className="text-sm text-slate-600 mb-2">Total Reports</p>
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {totalReports}
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors shadow-sm">
              <p className="text-sm text-slate-600 mb-2">Active Coordinators</p>
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {coordinatorCount}
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors shadow-sm">
              <p className="text-sm text-slate-600 mb-2">Active Facilitators</p>
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {facilitatorCount}
                </p>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 mb-6">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
}
