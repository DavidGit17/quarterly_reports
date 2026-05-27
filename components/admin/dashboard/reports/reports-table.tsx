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
import { formatIsoDate } from "@/lib/shared/date-format";
import { Eye, Edit2, Trash2, Download } from "lucide-react";

export type ReportsTableReport = {
  id: string;
  displayId: string;
  projectId?: string;
  projectName: string;
  language: string;
  quarter: string;
  submittedBy: string;
  status: "draft" | "submitted" | "approval-pending" | "approved" | "rejected";
  submissionDate: string;
};

interface ReportsTableProps {
  reports: ReportsTableReport[];
  onView: (report: ReportsTableReport) => void;
  onEdit: (report: ReportsTableReport) => void;
  onDelete: (report: ReportsTableReport) => void;
  onExport: (report: ReportsTableReport) => void;
  isLoading?: boolean;
}

export function ReportsTable({
  reports,
  onView,
  onEdit,
  onDelete,
  onExport,
  isLoading,
}: ReportsTableProps) {
  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>ID</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Quarter</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
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

  if (reports.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-500">No reports found</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>ID</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Quarter</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submission Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id} className="hover:bg-slate-50">
              <TableCell className="font-mono text-sm text-slate-600">
                {report.displayId}
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {report.projectName}
              </TableCell>
              <TableCell className="text-slate-600">
                {report.language}
              </TableCell>
              <TableCell className="text-slate-600">{report.quarter}</TableCell>
              <TableCell className="text-slate-600">
                {report.submittedBy}
              </TableCell>
              <TableCell>
                <StatusBadge status={report.status} />
              </TableCell>
              <TableCell className="text-slate-600">
                {formatIsoDate(report.submissionDate)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(report)}
                    title="View report"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(report)}
                    title="Edit report status"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExport(report)}
                    title="Download XLSX"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(report)}
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
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
