"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { mockProjects, type Project } from "@/components/admin/dashboard/mock-data";

type ProjectStatus = Project["status"];

type ProjectDraft = {
  name: string;
  description: string;
  languages: string;
  coordinators: string;
  status: ProjectStatus;
};

const emptyDraft: ProjectDraft = {
  name: "",
  description: "",
  languages: "",
  coordinators: "0",
  status: "active",
};

const toDraft = (project: Project): ProjectDraft => ({
  name: project.name,
  description: project.description,
  languages: project.languages.join(", "),
  coordinators: String(project.coordinators),
  status: project.status,
});

const toLanguages = (value: string) =>
  value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyDraft);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      project.description.toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  const saveProject = () => {
    const name = projectDraft.name.trim();
    const languages = toLanguages(projectDraft.languages);

    if (!name || languages.length === 0) {
      return;
    }

    const nextProject: Project = {
      id: editingProject?.id || `proj-${Date.now()}`,
      name,
      description: projectDraft.description.trim(),
      languages,
      coordinators: Number.parseInt(projectDraft.coordinators, 10) || 0,
      status: projectDraft.status,
      createdDate:
        editingProject?.createdDate || new Date().toISOString().slice(0, 10),
    };

    setProjects((prev) =>
      editingProject
        ? prev.map((project) =>
            project.id === editingProject.id ? nextProject : project,
          )
        : [...prev, nextProject],
    );
    setIsProjectDialogOpen(false);
  };

  const deleteProject = () => {
    if (!deletingProject) {
      return;
    }

    setProjects((prev) =>
      prev.filter((project) => project.id !== deletingProject.id),
    );
    setDeletingProject(null);
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <PageHeader
        title="Projects"
        subtitle="Manage your reporting projects and assignments"
        action={
          <Button
            onClick={openCreateProject}
            className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        }
      />

      <ProjectsSummary projects={projects} />

      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
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
        projects={filteredProjects}
        onEdit={openEditProject}
        onDelete={setDeletingProject}
      />

      <div className="mt-4 text-sm text-slate-600">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>

      <Dialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create Project"}
            </DialogTitle>
            <DialogDescription>
              Changes apply to this mock projects table only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Project Name
              </label>
              <Input
                value={projectDraft.name}
                onChange={(event) =>
                  setProjectDraft((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <Textarea
                value={projectDraft.description}
                onChange={(event) =>
                  setProjectDraft((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Project description"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Languages
              </label>
              <Input
                value={projectDraft.languages}
                onChange={(event) =>
                  setProjectDraft((prev) => ({
                    ...prev,
                    languages: event.target.value,
                  }))
                }
                placeholder="Genesis, Exodus, Matthew"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Coordinators
                </label>
                <Input
                  type="number"
                  min="0"
                  value={projectDraft.coordinators}
                  onChange={(event) =>
                    setProjectDraft((prev) => ({
                      ...prev,
                      coordinators: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <Select
                  value={projectDraft.status}
                  onValueChange={(value) =>
                    setProjectDraft((prev) => ({
                      ...prev,
                      status: value as ProjectStatus,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveProject}>
              {editingProject ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Delete {deletingProject?.name}? This only removes it from the
              current mock table session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteProject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
