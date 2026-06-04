"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input-shadcn";
import { PasswordInput } from "@/components/ui/password-input";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Toolbar } from "@/components/admin/dashboard/toolbar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  UserCog,
  UserCheck,
  Shield,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/dashboard/status-badge";
import { COORDINATOR_PROJECT_OPTIONS } from "@/lib/shared/form-storage";

type UserRole = "coordinator" | "facilitator" | "admin";
type UserStatus = "active" | "inactive";

type UserRecord = {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  project?: string;
  createdAt: string;
};

type UserDraft = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  project: string;
};

type UsersResponse = {
  users: UserRecord[];
  counts: {
    coordinator: number;
    facilitator: number;
    admin: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const emptyDraft: UserDraft = {
  username: "",
  email: "",
  password: "",
  role: "coordinator",
  project: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [counts, setCounts] = useState({ coordinator: 0, facilitator: 0, admin: 0, total: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<UserDraft>(emptyDraft);

  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editDraft, setEditDraft] = useState<UserDraft>(emptyDraft);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [togglingUser, setTogglingUser] = useState<UserRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchValue) params.set("search", searchValue);
      params.set("page", String(currentPage));
      params.set("limit", "50");

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.message || "Failed to fetch users.");
        return;
      }
      const data = (await response.json()) as UsersResponse;
      setUsers(data.users || []);
      setCounts(data.counts || { coordinator: 0, facilitator: 0, admin: 0, total: 0 });
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch {
      setErrorMessage("Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter, searchValue, currentPage]);

  const filterRef = useRef({ roleFilter, statusFilter, searchValue });

  useEffect(() => {
    const prev = filterRef.current;
    const newFilters = { roleFilter, statusFilter, searchValue };
    const filtersChanged =
      prev.roleFilter !== newFilters.roleFilter ||
      prev.statusFilter !== newFilters.statusFilter ||
      prev.searchValue !== newFilters.searchValue;

    if (filtersChanged) {
      filterRef.current = newFilters;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }
    void fetchUsers();
  }, [roleFilter, statusFilter, searchValue, currentPage, fetchUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchValue(searchInput);
  };

  const openCreate = () => {
    setCreateDraft(emptyDraft);
    setErrorMessage("");
    setIsCreateDialogOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditingUser(user);
    setEditDraft({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      project: user.project || "",
    });
    setErrorMessage("");
    setIsEditDialogOpen(true);
  };

  const handleCreate = async () => {
    setErrorMessage("");
    if (!createDraft.username.trim() || !createDraft.email.trim()) {
      setErrorMessage("Username and email are required.");
      return;
    }
    if (!createDraft.password) {
      setErrorMessage("Password is required.");
      return;
    }
    if (createDraft.role !== "admin" && !createDraft.project.trim()) {
      setErrorMessage("Project is required for non-admin users.");
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createDraft),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || "Failed to create user.");
        return;
      }
      setIsCreateDialogOpen(false);
      setSuccessMessage("User created successfully.");
      void fetchUsers();
    } catch {
      setErrorMessage("Failed to create user.");
    }
  };

  const handleEdit = async () => {
    setErrorMessage("");
    if (!editingUser) return;
    if (!editDraft.username.trim() || !editDraft.email.trim()) {
      setErrorMessage("Username and email are required.");
      return;
    }
    if (editDraft.role !== "admin" && !editDraft.project.trim()) {
      setErrorMessage("Project is required for non-admin users.");
      return;
    }

    const body: Record<string, string> = {
      id: editingUser._id,
      username: editDraft.username,
      email: editDraft.email,
      role: editDraft.role,
      project: editDraft.project,
    };
    if (editDraft.password) {
      body.password = editDraft.password;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || "Failed to update user.");
        return;
      }
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setSuccessMessage("User updated successfully.");
      void fetchUsers();
    } catch {
      setErrorMessage("Failed to update user.");
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/users?id=${deletingUser._id}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || "Failed to delete user.");
        return;
      }
      setDeletingUser(null);
      setSuccessMessage("User deleted successfully.");
      void fetchUsers();
    } catch {
      setErrorMessage("Failed to delete user.");
    }
  };

  const handleToggleStatus = async () => {
    if (!togglingUser) return;
    setErrorMessage("");

    const newStatus: UserStatus =
      togglingUser.status === "active" ? "inactive" : "active";

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: togglingUser._id, status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || "Failed to update status.");
        return;
      }
      setTogglingUser(null);
      setSuccessMessage(
        `User ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      );
      void fetchUsers();
    } catch {
      setErrorMessage("Failed to update status.");
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <PageHeader
        title="Users"
        subtitle="Manage all users (coordinators, facilitators, and admins)"
        action={
          <Button
            onClick={openCreate}
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        }
      />

      {successMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mb-4 p-1 bg-slate-100 rounded-2xl">
        {[
          { key: "all" as const, label: "All", icon: Users },
          { key: "coordinator" as const, label: "Coordinators", icon: UserCheck },
          { key: "facilitator" as const, label: "Facilitators", icon: UserCog },
          { key: "admin" as const, label: "Admins", icon: Shield },
        ].map(({ key, label, icon: Icon }) => {
          const count = key === "all" ? counts.total : counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setRoleFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                roleFilter === key
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`ml-0.5 text-xs tabular-nums ${
                roleFilter === key ? "text-slate-500" : "text-slate-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Toolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name or email..."
        onSearchSubmit={handleSearch}
        filters={
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | UserStatus)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="border border-slate-200 rounded-2xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <TableCell key={j} className="h-12">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">
                    {user.username}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {user.email}
                  </TableCell>
                  <TableCell className="capitalize text-slate-600">
                    {user.role}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {user.project || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTogglingUser(user)}
                        title={
                          user.status === "active"
                            ? "Deactivate"
                            : "Activate"
                        }
                      >
                        {user.status === "active" ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
          <div className="text-sm text-slate-600">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new coordinator, facilitator, or admin account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              value={createDraft.username}
              onChange={(e) =>
                setCreateDraft((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="Username"
            />
            <Input
              type="email"
              value={createDraft.email}
              onChange={(e) =>
                setCreateDraft((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Email address"
            />
            <PasswordInput
              value={createDraft.password}
              onChange={(e) =>
                setCreateDraft((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Password"
            />
            <Select
              value={createDraft.role}
              onValueChange={(value) =>
                setCreateDraft((prev) => ({
                  ...prev,
                  role: value as UserRole,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="facilitator">Facilitator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {createDraft.role !== "admin" && (
              <div className="sm:col-span-full">
              <Select
                value={createDraft.project}
                onValueChange={(value) =>
                  setCreateDraft((prev) => ({ ...prev, project: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {COORDINATOR_PROJECT_OPTIONS.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details. Leave password blank to keep current.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Input
              value={editDraft.username}
              onChange={(e) =>
                setEditDraft((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="Username"
            />
            <Input
              type="email"
              value={editDraft.email}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Email address"
            />
            <PasswordInput
              value={editDraft.password}
              onChange={(e) =>
                setEditDraft((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="New password (leave blank to keep current)"
            />
            <Select
              value={editDraft.role}
              onValueChange={(value) =>
                setEditDraft((prev) => ({
                  ...prev,
                  role: value as UserRole,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="facilitator">Facilitator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {editDraft.role !== "admin" && (
              <Select
                value={editDraft.project}
                onValueChange={(value) =>
                  setEditDraft((prev) => ({ ...prev, project: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {COORDINATOR_PROJECT_OPTIONS.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleEdit()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deletingUser?.username} ({deletingUser?.role})? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(togglingUser)}
        onOpenChange={(open) => !open && setTogglingUser(null)}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {togglingUser?.status === "active"
                ? "Deactivate User"
                : "Activate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {togglingUser?.status === "active" ? (
                <>
                  Deactivate <strong>{togglingUser?.username}</strong>?
                  They will not be able to log in or access any features
                  until reactivated. Their existing reports and data will
                  be preserved.
                </>
              ) : (
                <>
                  Activate <strong>{togglingUser?.username}</strong>?
                  They will regain access to their account and all
                  features.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleToggleStatus()}
              className={
                togglingUser?.status === "active"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              {togglingUser?.status === "active" ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
