"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input-shadcn";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Toolbar } from "@/components/admin/dashboard/toolbar";
import { ProjectsTable } from "@/components/admin/dashboard/projects/projects-table";
import { ProjectsSummary } from "@/components/admin/dashboard/projects/projects-summary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Project } from "@/components/admin/dashboard/mock-data";

const ProjectFormDialog = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/projects/project-form-dialog"
    ).then((mod) => ({ default: mod.ProjectFormDialog })),
);

const DeleteProjectDialog = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/projects/delete-project-dialog"
    ).then((mod) => ({ default: mod.DeleteProjectDialog })),
);

type ProjectStatus = Project["status"];

type ProjectDraft = {
  name: string;
  description: string;
  languages: string;
  status: ProjectStatus;
};

const emptyDraft: ProjectDraft = {
  name: "",
  description: "",
  languages: "",
  status: "active",
};

const toDraft = (project: Project): ProjectDraft => ({
  name: project.name,
  description: project.description,
  languages: project.languages.join(", "),
  status: project.status,
});

const toLanguages = (value: string) =>
  value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyDraft);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/projects");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load projects.");
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      project.description.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  }),
    [projects, debouncedSearch, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const paginatedProjects = useMemo(
    () => filteredProjects.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filteredProjects, page],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectDraft(emptyDraft);
    setIsProjectDialogOpen(true);
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectDraft(toDraft(project));
    setIsProjectDialogOpen(true);
  };

  const saveProject = async () => {
    const name = projectDraft.name.trim();
    const languages = toLanguages(projectDraft.languages);

    if (!name || languages.length === 0) {
      return;
    }

    try {
      setError("");

      if (editingProject) {
        const response = await fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProject.id,
            name,
            description: projectDraft.description.trim(),
            languages,
            status: projectDraft.status,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update project.");
        }
      } else {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: projectDraft.description.trim(),
            languages,
            status: projectDraft.status,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to create project.");
        }
      }

      setIsProjectDialogOpen(false);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
    }
  };

  const deleteProject = async () => {
    if (!deletingProject) {
      return;
    }

    try {
      setError("");
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingProject.id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete project.");
      }

      setDeletingProject(null);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project.");
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <PageHeader
        title="Projects"
        subtitle="Manage your reporting projects and assignments"
        action={
          <Button
            onClick={openCreateProject}
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProjectsSummary projects={projects} />

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-8 w-12 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 p-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-t border-slate-100">
                <div className="h-4 w-full bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      <Toolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by project name..."
        filters={
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <ProjectsTable
        projects={paginatedProjects}
        onEdit={openEditProject}
        onDelete={setDeletingProject}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-slate-600">
          Showing {paginatedProjects.length} of {filteredProjects.length} projects
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
        </>
      )}

      <ProjectFormDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        editingProject={editingProject}
        draft={projectDraft}
        onDraftChange={setProjectDraft}
        onSave={saveProject}
      />

      <DeleteProjectDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        deletingProject={deletingProject}
        onConfirm={deleteProject}
      />
    </main>
  );
}
