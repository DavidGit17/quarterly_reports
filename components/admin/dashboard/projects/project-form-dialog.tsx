"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input-shadcn";
import { Textarea } from "@/components/ui/textarea";
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
import type { Project } from "@/components/admin/dashboard/mock-data";

type ProjectStatus = Project["status"];

export type ProjectDraft = {
  name: string;
  description: string;
  languages: string;
  status: ProjectStatus;
};

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject: Project | null;
  draft: ProjectDraft;
  onDraftChange: (draft: ProjectDraft) => void;
  onSave: () => void;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  editingProject,
  draft,
  onDraftChange,
  onSave,
}: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingProject ? "Edit Project" : "Create Project"}
          </DialogTitle>
          <DialogDescription>
            {editingProject
              ? "Update the project details."
              : "Add a new project to the system."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Project Name
            </label>
            <Input
              value={draft.name}
              onChange={(event) =>
                onDraftChange({ ...draft, name: event.target.value })
              }
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <Textarea
              value={draft.description}
              onChange={(event) =>
                onDraftChange({ ...draft, description: event.target.value })
              }
              placeholder="Project description"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Languages
            </label>
            <Input
              value={draft.languages}
              onChange={(event) =>
                onDraftChange({ ...draft, languages: event.target.value })
              }
              placeholder="English, Spanish, French, German"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  onDraftChange({
                    ...draft,
                    status: value as ProjectStatus,
                  })
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {editingProject ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
