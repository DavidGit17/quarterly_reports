"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  KeyRound,
  LogOut,
  User,
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
  const [profileImage, setProfileImage] = useState("");
  const [formHref, setFormHref] = useState("");
  const [assignedProject, setAssignedProject] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

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
        if (!currentUser) { router.push("/auth"); return; }
        if (currentUser.role !== "facilitator") { router.push("/dashboard"); return; }
        setUsername(currentUser.username || "Facilitator");
        setProfileImage(currentUser.profileImage || "");
        setAssignedProject(currentUser.project || "");
        if (currentUser.project) {
          setFormHref(`/f/form/${toProjectSlug(currentUser.project)}`);
        }
        setIsReady(true);
      } catch { router.push("/auth"); }
    };
    void load();
  }, [router]);

  const fetchReports = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "5");
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
    if (isReady) void fetchReports(currentPage);
  }, [isReady, currentPage, fetchReports]);

  if (!isReady) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const hasSubmitted = assignedProject && reports.some(r => r.projectName === assignedProject);

  const quarterLabel = (() => {
    if (!assignedProject) return "";
    const quarters = getProjectQuarters();
    const q = quarters[assignedProject];
    return q ? `${q.startMonth} - ${q.endMonth}` : "";
  })();

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-[#F0F4F8]/80 backdrop-blur-xl border-b border-slate-200/30">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between relative">
          <Link href="/f" className="absolute left-1/2 -translate-x-1/2 sm:static sm:left-auto sm:translate-x-0 sm:mr-auto">
            <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-6 sm:h-7 w-auto" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={() => { cancelClose(); setProfileOpen(true); }}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#4b6358]"
                aria-label="Profile menu"
                title="Profile"
              >
                <Avatar className="h-9 w-9 border-2 border-slate-200">
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
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-2 z-50"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-[#1a1c1e]">{username}</p>
                    <p className="text-xs text-[#5e6a6e]">Facilitator</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1c1e] hover:bg-slate-50 transition-colors min-h-[36px] shrink-0 w-full text-left"
                  >
                    <User className="h-4 w-4 text-[#5e6a6e]" />
                    My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); router.push("/profile?tab=password"); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1c1e] hover:bg-slate-50 transition-colors min-h-[36px] shrink-0 w-full text-left"
                  >
                    <KeyRound className="h-4 w-4 text-[#5e6a6e]" />
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      clearCurrentUserCache();
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.push("/auth");
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors min-h-[36px] shrink-0"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[#F0F4F8]" />
        <svg className="absolute top-[10%] right-[5%] w-64 h-64 text-[#D6E0EB] opacity-[0.08]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="160" height="160" rx="8" stroke="currentColor" strokeWidth="2" />
          <rect x="40" y="40" width="120" height="8" rx="2" fill="currentColor" />
          <rect x="40" y="56" width="80" height="4" rx="2" fill="currentColor" opacity="0.6" />
          <rect x="40" y="68" width="100" height="4" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="40" y="88" width="60" height="4" rx="2" fill="currentColor" opacity="0.6" />
          <rect x="40" y="100" width="80" height="4" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="120" y="88" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <rect x="128" y="96" width="24" height="3" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="128" y="104" width="16" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <line x1="20" y1="140" x2="180" y2="140" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <circle cx="40" cy="148" r="3" fill="currentColor" opacity="0.5" />
          <circle cx="70" cy="148" r="3" fill="currentColor" opacity="0.5" />
          <circle cx="100" cy="148" r="3" fill="currentColor" opacity="0.5" />
          <line x1="40" y1="148" x2="40" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="70" y1="148" x2="70" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="148" x2="100" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
        <svg className="absolute bottom-[15%] left-[3%] w-48 h-48 text-[#D6E0EB] opacity-[0.06]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />
          <path d="M100 40 L100 100 L140 120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="100" r="4" fill="currentColor" />
          <circle cx="100" cy="40" r="3" fill="currentColor" />
          <circle cx="140" cy="120" r="3" fill="currentColor" />
          <line x1="40" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="40" y1="68" x2="70" y2="68" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="130" y1="150" x2="170" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="130" y1="158" x2="160" y2="158" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
        <svg className="absolute top-[40%] left-[8%] w-32 h-32 text-[#D6E0EB] opacity-[0.05]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" rx="4" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
          <line x1="50" y1="30" x2="50" y2="50" stroke="currentColor" strokeWidth="1" />
          <line x1="50" y1="50" x2="65" y2="58" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-[30%] right-[10%] w-40 h-40 text-[#D6E0EB] opacity-[0.05]" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 60 L50 30 L80 60 L110 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="20" cy="60" r="3" fill="currentColor" />
          <circle cx="50" cy="30" r="3" fill="currentColor" />
          <circle cx="80" cy="60" r="3" fill="currentColor" />
          <circle cx="110" cy="30" r="3" fill="currentColor" />
          <line x1="20" y1="66" x2="20" y2="80" stroke="currentColor" strokeWidth="1" />
          <line x1="50" y1="36" x2="50" y2="80" stroke="currentColor" strokeWidth="1" />
          <line x1="80" y1="66" x2="80" y2="80" stroke="currentColor" strokeWidth="1" />
          <line x1="30" y1="90" x2="90" y2="90" stroke="currentColor" strokeWidth="1" />
          <rect x="10" y="90" width="100" height="20" rx="3" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#1a1c1e]">
            Welcome back, {username}
          </h1>
          {formHref ? (
            <p className="mt-1 text-[15px] text-[#5e6a6e]">
              You have 1 active report request awaiting submission.
            </p>
          ) : (
            <p className="mt-1 text-[15px] text-[#5e6a6e]">
              No reporting tasks are currently assigned to you. New reporting cycles will appear here automatically.
            </p>
          )}
        </div>

        {/* Assigned Reports */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5e6a6e] mb-3">
            Assigned Reports
          </h2>
          {formHref ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#1a1c1e]">{assignedProject}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-sm text-[#5e6a6e]">
                      {quarterLabel || "Quarterly report"}
                    </span>
                    <StatusBadge status={hasSubmitted ? "submitted" : "pending"} />
                  </div>
                </div>
              </div>
              <Link
                href={formHref}
                className="inline-flex items-center justify-center rounded-xl bg-[#4b6358] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#344b41] transition-colors"
              >
                {hasSubmitted ? "Continue Submission" : "Open Form"}
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm text-center">
              <svg className="mx-auto mb-4 w-16 h-16 text-slate-300" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="6" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2" />
                <rect x="18" y="14" width="28" height="4" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="18" y="22" width="20" height="3" rx="1" fill="currentColor" opacity="0.4" />
                <rect x="18" y="30" width="24" height="3" rx="1" fill="currentColor" opacity="0.5" />
                <rect x="18" y="38" width="16" height="3" rx="1" fill="currentColor" opacity="0.3" />
                <line x1="12" y1="44" x2="52" y2="44" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeDasharray="3 2" />
                <circle cx="32" cy="50" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                <line x1="32" y1="50" x2="38" y2="54" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              </svg>
              <h3 className="text-base font-semibold text-[#1a1c1e] mb-2">
                No active report requests
              </h3>
              <p className="text-sm text-[#5e6a6e] max-w-sm mx-auto leading-relaxed">
                You currently have no reporting tasks assigned. New reporting cycles will appear here automatically.
              </p>
            </div>
          )}
        </div>

        {/* Submission History */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5e6a6e] mb-3">
            Submission History
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto mb-4 w-14 h-14 text-slate-300" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="4" width="36" height="48" rx="3" stroke="currentColor" strokeWidth="2" />
                  <rect x="16" y="12" width="24" height="3" rx="1" fill="currentColor" opacity="0.5" />
                  <rect x="16" y="19" width="18" height="2" rx="1" fill="currentColor" opacity="0.3" />
                  <rect x="16" y="25" width="22" height="2" rx="1" fill="currentColor" opacity="0.4" />
                  <circle cx="28" cy="36" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                  <line x1="28" y1="34" x2="28" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                  <line x1="26" y1="36" x2="30" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                  <path d="M28 42 L28 46" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                </svg>
                <h3 className="text-base font-semibold text-[#1a1c1e] mb-2">
                  No submissions yet
                </h3>
                <p className="text-sm text-[#5e6a6e] max-w-sm mx-auto leading-relaxed">
                  Reports you submit during reporting cycles will appear here.
                </p>
              </div>
            ) : (
              <div>
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <p className="text-sm text-[#5e6a6e]">
                    {pagination.total} report{pagination.total !== 1 ? "s" : ""} submitted
                  </p>
                  <Link
                    href="/f/my-reports"
                    className="text-sm font-medium text-[#4b6358] hover:text-[#2a3d35] transition-colors"
                  >
                    View All Reports →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">Quarter</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#424845]">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#424845]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.slice(0, 5).map((report) => (
                        <tr key={report.id} className="transition-colors hover:bg-[#cee9db]/25">
                          <td className="px-6 py-3 text-sm font-medium text-[#1a1c1e]">{report.projectName}</td>
                          <td className="px-6 py-3 text-sm text-[#5e6a6e]">{report.quarter}</td>
                          <td className="px-6 py-3 text-sm text-[#5e6a6e]">{formatDate(report.createdAt)}</td>
                          <td className="px-6 py-3 text-right">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
