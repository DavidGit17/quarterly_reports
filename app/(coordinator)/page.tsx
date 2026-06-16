"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Search,
  LogOut,
  User,
  KeyRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { toProjectSlug, getProjectQuarters } from "@/lib/shared/form-storage";
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
  const [deadline, setDeadline] = useState("");
  const [formHref, setFormHref] = useState("");
  const [assignedProject, setAssignedProject] = useState("");
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
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => setProfileOpen(false), 200);
  };

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
        setAssignedProject(currentUser.project || "");
        setDeadline(currentUser.deadline || "");
        if (currentUser.project && currentUser.deadline) {
          setFormHref(`/form/${toProjectSlug(currentUser.project)}`);
        }
        setIsReady(true);
      } catch {
        router.push("/auth");
      }
    };
    void load();
  }, [router]);

  const fetchReports = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "5");
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
    if (isReady) void fetchReports(currentPage);
  }, [isReady, currentPage, fetchReports]);

  if (!isReady) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasSubmitted = assignedProject && reports.some((r) => r.projectName === assignedProject);
  
  const quarterLabel = (() => {
    if (!assignedProject) return "";
    const quarters = getProjectQuarters();
    const q = quarters[assignedProject];
    return q ? `${q.startMonth} - ${q.endMonth}` : "";
  })();

  const filteredReports = reports.filter((r) =>
    !searchValue || r.projectName.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="min-h-screen  text-zinc-900 selection:bg-zinc-200 bg-luxury-glass-1">
      
      {/* 1. Global Nav & Page Header */}
      <nav className="sticky top-0 z-50 h-14 sm:h-16 bg-white backdrop-blur-2xl border-b border-zinc-200/20 px-4 sm:px-6 flex items-center justify-center relative">
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 sm:static sm:left-auto sm:translate-x-0 sm:mr-auto">
          <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-6 sm:h-7 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <div
            className="relative"
            ref={dropdownRef}
            onMouseEnter={() => {
              cancelClose();
              setProfileOpen(true);
            }}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-950 ring-offset-2 transition-all"
              aria-label="Profile menu"
              title="Profile"
            >
              <Avatar className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={username} />
                ) : null}
                <AvatarFallback className="text-xs font-semibold text-zinc-900 bg-zinc-100">
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
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200/80 bg-white shadow-sm py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <div className="px-4 py-3 border-b border-zinc-100 mb-1">
                  <p className="text-sm font-semibold text-zinc-900">{username}</p>
                  <p className="text-xs text-zinc-500 font-medium">Coordinator</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/profile");
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors w-full text-left font-medium"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/profile?tab=password");
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors w-full text-left font-medium"
                >
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    clearCurrentUserCache();
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/auth");
                  }}
                  className="flex items-center gap-3 px-4 py-2 mt-1 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* 2. Page Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Welcome, {username}
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Quarterly Reports Dashboard
          </p>
        </div>

        {/* 3. Unified Card Geometry - Assigned Reports */}
        <div className="w-full bg-white  rounded-xl border border-zinc-200/60 shadow-sm p-6 sm:p-8">
          {formHref ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900">{assignedProject}</h3>
                    <StatusBadge status={hasSubmitted ? "submitted" : "pending"} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm font-medium text-zinc-500">
                    <span>{quarterLabel || "Quarterly report"}</span>
                    {deadline && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span>Due {deadline}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={formHref}
                className="h-11 px-6 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
              >
                {hasSubmitted ? "Continue" : "Open Report"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-base font-semibold text-zinc-900">No active report requests</p>
              <p className="text-sm font-medium text-zinc-500 mt-1 text-center">New reporting cycles will appear here automatically.</p>
            </div>
          )}
        </div>

        {/* 4. Submission History & Search Bar Optimization */}
        <div className="w-full bg-white rounded-xl border border-zinc-200/60 shadow-sm p-6 sm:p-8">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                Submission History
              </h2>
              {pagination.total > 0 && (
                <span className="h-6 px-2 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-600 flex items-center justify-center">
                  {pagination.total}
                </span>
              )}
            </div>

            {/* Constrained Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-50/50 px-3.5 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100/60 rounded-md w-full" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            
            /* 5. Empty State & Embedded Report Workflow SVG Illustration */
            <div className="flex flex-col items-center justify-center py-16 text-center relative overflow-hidden rounded-lg bg-zinc-50/50 border border-zinc-100">
              
              <svg className="w-48 h-32 mb-6 text-zinc-200" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Grid Pattern */}
                <path d="M0 20H200M0 40H200M0 60H200M0 80H200M0 100H200M20 0V120M40 0V120M60 0V120M80 0V120M100 0V120M120 0V120M140 0V120M160 0V120M180 0V120" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1"/>
                
                {/* Workflow Nodes */}
                <circle cx="40" cy="60" r="4" fill="#a1a1aa"/>
                <path d="M44 60H90" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="4 4"/>
                
                {/* Main Document Graphic */}
                <rect x="90" y="30" width="44" height="60" rx="4" fill="white" stroke="#d4d4d8" strokeWidth="2"/>
                <rect x="98" y="42" width="28" height="4" rx="2" fill="#e4e4e7"/>
                <rect x="98" y="52" width="28" height="4" rx="2" fill="#e4e4e7"/>
                <rect x="98" y="62" width="16" height="4" rx="2" fill="#e4e4e7"/>
                
                {/* Output Nodes */}
                <path d="M134 60H160" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="4 4"/>
                <circle cx="164" cy="60" r="4" fill="#a1a1aa"/>
                
                {/* Status Indicator */}
                <circle cx="126" cy="82" r="10" fill="white" stroke="#d4d4d8" strokeWidth="2"/>
                <path d="M122 82L125 85L130 79" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <p className="text-sm font-medium text-zinc-500">
                {searchValue 
                  ? "No reports match your search query." 
                  : "No submissions yet. Reports you submit will appear here."}
              </p>

              {!searchValue && formHref && (
                <Link
                  href={formHref}
                  className="h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium text-zinc-900 transition-all inline-flex items-center gap-2 mt-6 shadow-sm"
                >
                  Submit your first report
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50/50">
                  <tr className="border-y border-zinc-200/60">
                    <th className="px-6 py-3 font-semibold text-zinc-900">Project</th>
                    <th className="px-6 py-3 font-semibold text-zinc-900">Quarter</th>
                    <th className="px-6 py-3 font-semibold text-zinc-900">Date</th>
                    <th className="px-6 py-3 font-semibold text-zinc-900 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="transition-colors hover:bg-zinc-50/80 group">
                      <td className="px-6 py-3.5 font-medium text-zinc-900">{report.projectName}</td>
                      <td className="px-6 py-3.5 text-zinc-500">{report.quarter}</td>
                      <td className="px-6 py-3.5 text-zinc-500">{formatDate(report.createdAt)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/report/${report.id}`}
                          className="inline-flex items-center justify-center h-8 px-3 rounded text-sm font-medium text-zinc-900 hover:bg-zinc-200/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}