"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  buildFormConfigs,
  getDefaultFields,
  getCustomFormConfigs,
  getProjectQuarters,
  getFormTitles,
  getFormMeta,
  toProjectSlug,
  type ProjectFormConfigs,
  type FormTitles,
  type FormMeta,
} from "@/lib/shared/form-storage";
import { getCurrentUser } from "@/lib/shared/auth-client";
import { ChevronRight, FileText, Eye } from "lucide-react";

export default function FormsOverviewPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [formConfigs, setFormConfigs] = useState<ProjectFormConfigs>({});
  const [quarterConfigs, setQuarterConfigs] = useState<
    Record<string, { startMonth?: string; endMonth?: string }>
  >({});
  const [formTitles, setFormTitles] = useState<FormTitles>({});
  const [formMeta, setFormMeta] = useState<FormMeta>({ lastSavedAt: null });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      if (currentUser.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      const defaultFields = getDefaultFields();
      const customConfigs = getCustomFormConfigs();
      setFormConfigs(buildFormConfigs(defaultFields, customConfigs));
      setQuarterConfigs(getProjectQuarters());
      setFormTitles(getFormTitles());
      setFormMeta(getFormMeta());
      setIsLoading(false);
    } catch {
      router.push("/auth");
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        fetchData();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [fetchData]);

  if (!isAdmin || isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-9 w-48 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-64 bg-slate-200 rounded" />
            </div>
            <div className="h-10 w-28 bg-slate-200 rounded-2xl" />
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-4 bg-slate-200 rounded" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
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
            <h1 className="text-2xl font-semibold text-slate-900">
              Modify and Preview the Forms
            </h1>
          </div>
          <Link
            href="/form-builder"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create Forms
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4">
        {projectList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">No forms created yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Create forms in the Form Builder to see them here
            </p>
            <Link
              href="/form-builder"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
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
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Project Header */}
                <button
                  onClick={() =>
                    setExpandedProject(isExpanded ? null : project)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-700" />
                    </div>
                      <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {formTitles[toProjectSlug(project)] || project}
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
                    <div className="flex gap-2">
                      <Link
                        href={`/form/${toProjectSlug(project)}?preview=true`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Preview Form
                      </Link>
                      <Link
                        href={`/form-builder?project=${encodeURIComponent(project)}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-900 text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
                        Modify Form
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
