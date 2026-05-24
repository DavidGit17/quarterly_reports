"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Toolbar } from "@/components/admin/dashboard/toolbar";
import { CoordinatorsTable } from "@/components/admin/dashboard/coordinators/coordinators-table";
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
import { mockCoordinators, type Coordinator } from "@/components/admin/dashboard/mock-data";

type CoordinatorDraft = Omit<Coordinator, "id" | "joinDate">;

const emptyDraft: CoordinatorDraft = {
  name: "",
  email: "",
  phone: "",
  projects: 0,
  role: "Coordinator",
  status: "active",
};

const toDraft = (coordinator: Coordinator): CoordinatorDraft => ({
  name: coordinator.name,
  email: coordinator.email,
  phone: coordinator.phone,
  projects: coordinator.projects,
  role: coordinator.role,
  status: coordinator.status,
});

export default function CoordinatorsPage() {
  const [coordinators, setCoordinators] =
    useState<Coordinator[]>(mockCoordinators);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [editingCoordinator, setEditingCoordinator] =
    useState<Coordinator | null>(null);
  const [deletingCoordinator, setDeletingCoordinator] =
    useState<Coordinator | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draft, setDraft] = useState<CoordinatorDraft>(emptyDraft);

  const filteredCoordinators = coordinators.filter((coord) => {
    const matchesSearch =
      coord.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      coord.email.toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || coord.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openCreate = () => {
    setEditingCoordinator(null);
    setDraft(emptyDraft);
    setIsDialogOpen(true);
  };

  const openEdit = (coordinator: Coordinator) => {
    setEditingCoordinator(coordinator);
    setDraft(toDraft(coordinator));
    setIsDialogOpen(true);
  };

  const saveCoordinator = () => {
    if (!draft.name.trim() || !draft.email.trim()) return;

    const nextCoordinator: Coordinator = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      role: draft.role.trim() || "Coordinator",
      id: editingCoordinator?.id || `coord-${Date.now()}`,
      joinDate:
        editingCoordinator?.joinDate || new Date().toISOString().slice(0, 10),
    };

    setCoordinators((prev) =>
      editingCoordinator
        ? prev.map((coord) =>
            coord.id === editingCoordinator.id ? nextCoordinator : coord,
          )
        : [...prev, nextCoordinator],
    );
    setIsDialogOpen(false);
  };

  const deleteCoordinator = () => {
    if (!deletingCoordinator) return;
    setCoordinators((prev) =>
      prev.filter((coord) => coord.id !== deletingCoordinator.id),
    );
    setDeletingCoordinator(null);
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <PageHeader
        title="Coordinators"
        subtitle="Manage your report coordinators and their assignments"
        action={
          <Button
            onClick={openCreate}
            className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Coordinator
          </Button>
        }
      />

      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search by name or email..."
        filters={
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <CoordinatorsTable
        coordinators={filteredCoordinators}
        onEdit={openEdit}
        onDelete={setDeletingCoordinator}
      />

      <div className="mt-4 text-sm text-slate-600">
        Showing {filteredCoordinators.length} of {coordinators.length}{" "}
        coordinators
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Full name"
            />
            <Input
              type="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email address"
            />
            <Input
              value={draft.phone}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder="Phone number"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                value={draft.role}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, role: event.target.value }))
                }
                placeholder="Role"
              />
              <Input
                type="number"
                min="0"
                value={draft.projects}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    projects: Number.parseInt(event.target.value, 10) || 0,
                  }))
                }
                placeholder="Projects"
              />
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    status: value as Coordinator["status"],
                  }))
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCoordinator}>
              {editingCoordinator ? "Save Changes" : "Add Coordinator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingCoordinator)}
        onOpenChange={(open) => !open && setDeletingCoordinator(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coordinator</DialogTitle>
            <DialogDescription>
              Delete {deletingCoordinator?.name}? This only removes the row from
              the current mock table session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCoordinator(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCoordinator}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
