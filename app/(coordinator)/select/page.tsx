"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MeResponse = {
  user?: {
    role: "admin" | "coordinator";
  };
};

export default function SelectPage() {
  const router = useRouter();
  const [project, setProject] = useState("");
  const [quarter, setQuarter] = useState("");
  const [isReady, setIsReady] = useState(false);

  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  useEffect(() => {
    const verifyCoordinator = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const data = (await response.json()) as MeResponse;

        if (data.user?.role === "admin") {
          router.push("/dashboard");
          return;
        }

        setIsReady(true);
      } catch {
        router.push("/login");
      }
    };

    void verifyCoordinator();
  }, [router]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (project && quarter) {
      // Store selection in URL params for the report form
      router.push(
        `/submit-report?project=${encodeURIComponent(project)}&quarter=${quarter}`,
      );
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-5 w-16 bg-slate-200 rounded mb-8" />
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <div className="h-7 w-24 bg-slate-200 rounded mb-3" />
              <div className="h-14 w-full bg-slate-200 rounded-xl" />
            </div>
            <div>
              <div className="h-7 w-20 bg-slate-200 rounded mb-3" />
              <div className="h-14 w-full bg-slate-200 rounded-xl" />
            </div>
            <div className="h-14 w-full bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="#"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
          >
            ← Back
          </Link>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-8">
            Enter Project & Quarter
          </h1>
          <form onSubmit={handleContinue} className="space-y-6">
            <div>
              <label
                htmlFor="project"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Project
              </label>
              <input
                id="project"
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] text-slate-800 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Type project name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="quarter"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Quarter
              </label>
              <select
                id="quarter"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] text-slate-800 transition-all duration-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Select a quarter</option>
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-700 px-8 py-3 text-[16px] font-semibold text-white transition-all duration-200 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
