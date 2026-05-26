"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getHydratedFormState,
  toProjectSlug,
  type ProjectFormConfigs,
} from "@/lib/shared/form-storage";
import { ChevronRight, FileText, Eye } from "lucide-react";

export default function FormsOverviewPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [formConfigs, setFormConfigs] = useState<ProjectFormConfigs>({});
  const [quarterConfigs, setQuarterConfigs] = useState<
    Record<string, { startMonth?: string; endMonth?: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [authRes, formState] = await Promise.all([
        fetch("/api/auth/me", { method: "GET" }),
        getHydratedFormState(),
      ]);

      if (!authRes.ok) {
        router.push("/login");
        return;
      }

      const authData = (await authRes.json()) as {
        user?: { role: string };
      };
      if (authData.user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      setFormConfigs(formState.formConfigs);
      setQuarterConfigs(formState.quarterConfigs);
      setIsLoading(false);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isAdmin || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const projectList = Object.keys(formConfigs).sort();

  const getQuarterLabel = (project: string) => {
    const config = quarterConfigs[project];
    if (config?.startMonth && config?.endMonth) {
      return `${config.startMonth} - ${config.endMonth}`;
    }
    return "January - March";
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Forms Overview
            </h1>
            <p className="text-slate-600 mt-1">
              View all created forms for each project
            </p>
          </div>
          <Link
            href="/form-builder"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Edit Forms
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4">
        {projectList.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">No forms created yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Create forms in the Form Builder to see them here
            </p>
            <Link
              href="/form-builder"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Go to Form Builder
            </Link>
          </div>
        ) : (
          projectList.map((project) => {
            const fields = formConfigs[project] || [];
            const isExpanded = expandedProject === project;

            return (
              <div
                key={project}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Project Header */}
                <button
                  onClick={() =>
                    setExpandedProject(isExpanded ? null : project)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {project}
                      </h2>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Quarter: {getQuarterLabel(project)} • {fields.length}{" "}
                        {fields.length === 1 ? "field" : "fields"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={`h-5 w-5 text-slate-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Fields List */}
                {isExpanded && (
                  <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
                    <div className="space-y-3">
                      {fields.length === 0 ? (
                        <p className="text-sm text-slate-600">
                          No fields configured
                        </p>
                      ) : (
                        fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-slate-900 word-wrap">
                                    {field.label.replace(/^\d+\.\s*/, "")}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                                      {field.type}
                                    </span>
                                    {field.required !== false && (
                                      <span className="text-red-600 text-xs font-semibold">
                                        Required
                                      </span>
                                    )}
                                    {field.type === "choice" &&
                                      field.choices &&
                                      field.choices.length > 0 && (
                                        <span className="text-xs text-slate-600">
                                          {field.choices.length} options
                                        </span>
                                      )}
                                    {field.type === "rating" && (
                                      <span className="text-xs text-slate-600">
                                        {field.ratingLevels || 5} levels
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
                      <Link
                        href={`/form/${toProjectSlug(project)}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Preview Form
                      </Link>
                      <Link
                        href={`/form-builder?project=${encodeURIComponent(project)}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
                        Edit Form
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
