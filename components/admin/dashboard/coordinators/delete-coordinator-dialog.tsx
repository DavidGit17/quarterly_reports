"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Coordinator } from "@/components/admin/dashboard/mock-data";

interface DeleteCoordinatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletingCoordinator: Coordinator | null;
  onConfirm: () => void;
}

export function DeleteCoordinatorDialog({
  open,
  onOpenChange,
  deletingCoordinator,
  onConfirm,
}: DeleteCoordinatorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Coordinator</DialogTitle>
          <DialogDescription>
            Delete {deletingCoordinator?.name}? This only removes the row from
            the current mock table session.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
