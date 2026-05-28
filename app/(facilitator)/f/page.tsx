"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, ClipboardList } from "lucide-react";
import { toProjectSlug } from "@/lib/shared/form-storage";

type MeResponse = {
  user?: {
    role: string;
    project?: string;
    username?: string;
  };
};

export default function FacilitatorDashboard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [formHref, setFormHref] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status === 401) { router.push("/login"); return; }
        const data = (await res.json()) as MeResponse;
        if (data.user?.role !== "facilitator") { router.push("/dashboard"); return; }
        setUsername(data.user?.username || "Facilitator");
        if (data.user?.project) {
          setFormHref(`/f/form/${toProjectSlug(data.user.project)}`);
        }
        setIsReady(true);
      } catch { router.push("/login"); }
    };
    void load();
  }, [router]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[#1a1c1e]">
            Welcome, {username}
          </h1>
          <p className="mt-2 text-[15px] text-[#5e6a6e]">
            Quarterly Reports Dashboard
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href={formHref || "/f/select"}
            className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <FileText className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1a1c1e]">New Report</h2>
              <p className="text-sm text-[#5e6a6e]">Submit a new quarterly report</p>
            </div>
            <svg className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>

          <Link
            href="/f/my-reports"
            className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1a1c1e]">My Reports</h2>
              <p className="text-sm text-[#5e6a6e]">View your submitted reports</p>
            </div>
            <svg className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
