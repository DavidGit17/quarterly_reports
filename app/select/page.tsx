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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="#"
              onClick={() => router.back()}
              className="text-blue-500 hover:underline text-lg font-medium"
            >
              ← Back
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
              Enter Project & Quarter
            </h1>
          </div>
          <Link
            href="/profile"
            className="text-blue-700 hover:underline font-medium"
          >
            Profile
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-300 p-8">
          <form onSubmit={handleContinue} className="space-y-6">
            <div>
              <label
                htmlFor="project"
                className="block text-xl font-semibold text-slate-800 mb-3"
              >
                Project
              </label>
              <input
                id="project"
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-5 py-3 border border-slate-300 rounded-xl text-xl text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Type project name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="quarter"
                className="block text-xl font-semibold text-slate-800 mb-3"
              >
                Quarter
              </label>
              <select
                id="quarter"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full px-5 py-3 border border-slate-300 rounded-xl text-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="w-full bg-blue-900 text-white py-3.5 rounded-xl text-xl font-medium hover:bg-blue-950 transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
