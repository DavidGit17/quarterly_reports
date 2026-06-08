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
import { Edit2, Trash2 } from "lucide-react";

export interface Facilitator {
  id: string;
  name: string;
  email: string;
  phone: string;
  projects: number;
  role: string;
  status: "active" | "inactive";
  joinDate: string;
}

interface FacilitatorsTableProps {
  facilitators: Facilitator[];
  onEdit: (facilitator: Facilitator) => void;
  onDelete: (facilitator: Facilitator) => void;
  isLoading?: boolean;
}

export function FacilitatorsTable({
  facilitators,
  onEdit,
  onDelete,
  isLoading,
}: FacilitatorsTableProps) {
  if (isLoading) {
    return (
    <div className="border border-slate-200 rounded-2xl overflow-x-auto">
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

  if (facilitators.length === 0) {
    return (
      <div className="border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-slate-500">No facilitators found</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
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
          {facilitators.map((facilitator) => (
            <TableRow key={facilitator.id} className="hover:bg-slate-50">
              <TableCell className="font-medium text-slate-900">
                {facilitator.name}
              </TableCell>
              <TableCell className="text-slate-600">
                {facilitator.email}
              </TableCell>
              <TableCell className="text-slate-600">
                {facilitator.phone}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {facilitator.projects}
              </TableCell>
              <TableCell className="text-slate-600">
                {facilitator.role}
              </TableCell>
              <TableCell>
                <StatusBadge status={facilitator.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(facilitator)}
                    title="Edit facilitator"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(facilitator)}
                    title="Delete facilitator"
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
