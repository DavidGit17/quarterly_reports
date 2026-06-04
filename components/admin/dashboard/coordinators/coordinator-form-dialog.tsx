"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input-shadcn";
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
import type { Coordinator } from "@/components/admin/dashboard/mock-data";

export type CoordinatorDraft = Omit<Coordinator, "id" | "joinDate">;

interface CoordinatorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCoordinator: Coordinator | null;
  draft: CoordinatorDraft;
  onDraftChange: (draft: CoordinatorDraft) => void;
  onSave: () => void;
}

export function CoordinatorFormDialog({
  open,
  onOpenChange,
  editingCoordinator,
  draft,
  onDraftChange,
  onSave,
}: CoordinatorFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCoordinator ? "Edit Coordinator" : "Add Coordinator"}
          </DialogTitle>
          <DialogDescription>
            Changes apply to this mock coordinators table only.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Input
            value={draft.name}
            onChange={(event) =>
              onDraftChange({ ...draft, name: event.target.value })
            }
            placeholder="Full name"
          />
          <Input
            type="email"
            value={draft.email}
            onChange={(event) =>
              onDraftChange({ ...draft, email: event.target.value })
            }
            placeholder="Email address"
          />
          <Input
            value={draft.phone}
            onChange={(event) =>
              onDraftChange({ ...draft, phone: event.target.value })
            }
            placeholder="Phone number"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              value={draft.role}
              onChange={(event) =>
                onDraftChange({ ...draft, role: event.target.value })
              }
              placeholder="Role"
            />
            <Input
              type="number"
              min="0"
              value={draft.projects}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  projects: Number.parseInt(event.target.value, 10) || 0,
                })
              }
              placeholder="Projects"
            />
            <Select
              value={draft.status}
              onValueChange={(value) =>
                onDraftChange({
                  ...draft,
                  status: value as Coordinator["status"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {editingCoordinator ? "Save Changes" : "Add Coordinator"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
