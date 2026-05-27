"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../status-badge";
import { Coordinator } from "@/components/admin/dashboard/mock-data";
import { Edit2, Trash2 } from "lucide-react";

interface CoordinatorsTableProps {
  coordinators: Coordinator[];
  onEdit: (coordinator: Coordinator) => void;
  onDelete: (coordinator: Coordinator) => void;
  isLoading?: boolean;
}

export function CoordinatorsTable({
  coordinators,
  onEdit,
  onDelete,
  isLoading,
}: CoordinatorsTableProps) {
  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <TableCell key={j} className="h-12">
                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (coordinators.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-500">No coordinators found</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Projects</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coordinators.map((coordinator) => (
            <TableRow key={coordinator.id} className="hover:bg-slate-50">
              <TableCell className="font-medium text-slate-900">
                {coordinator.name}
              </TableCell>
              <TableCell className="text-slate-600">
                {coordinator.email}
              </TableCell>
              <TableCell className="text-slate-600">
                {coordinator.phone}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {coordinator.projects}
              </TableCell>
              <TableCell className="text-slate-600">
                {coordinator.role}
              </TableCell>
              <TableCell>
                <StatusBadge status={coordinator.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(coordinator)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(coordinator)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
