"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Toolbar } from "@/components/admin/dashboard/toolbar";
import {
  ReportsTable,
  type ReportsTableReport,
} from "@/components/admin/dashboard/reports/reports-table";
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
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { mockActiveSessions } from "@/components/admin/dashboard/mock-data";

const ReportsSummary = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/reports/reports-summary"
    ).then((mod) => ({ default: mod.ReportsSummary })),
  { ssr: false },
);

const LiveActivity = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/reports/live-activity"
    ).then((mod) => ({ default: mod.LiveActivity })),
  { ssr: false },
);

type ReportStatus =
  | "draft"
  | "submitted"
  | "approval-pending"
  | "approved"
  | "rejected";

type ReportSubmission = {
  id: string;
  projectName: string;
  quarter: string;
  createdByUsername: string;
  createdAt: string;
  status: ReportStatus;
  dynamicFields: Array<{
    fieldId: string;
    label: string;
    value: string | string[];
  }>;
};

type ReportsResponse = {
  reports?: ReportSubmission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

type ReportResponse = {
  report?: ReportSubmission;
  message?: string;
};

const statusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approval-pending", label: "Approval Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const textEncoder = new TextEncoder();

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (buffer: Uint8Array, offset: number, value: number) => {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
};

const writeUint32 = (buffer: Uint8Array, offset: number, value: number) => {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
};

const createZip = (files: Array<{ name: string; content: string }>) => {
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const contentBytes = textEncoder.encode(file.content);
    const checksum = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, contentBytes.length);
    writeUint32(localHeader, 22, contentBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, contentBytes.length);
    writeUint32(centralHeader, 24, contentBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectorySize = centralDirectory.reduce(
    (size, chunk) => size + chunk.length,
    0,
  );
  const endRecord = new Uint8Array(22);
  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 8, files.length);
  writeUint16(endRecord, 10, files.length);
  writeUint32(endRecord, 12, centralDirectorySize);
  writeUint32(endRecord, 16, offset);

  return new Blob([...chunks, ...centralDirectory, endRecord], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

const createWorkbookBlob = (
  rows: Array<Record<string, string>>,
  columns: string[],
) => {
  const sheetRows = [
    columns,
    ...rows.map((row) => columns.map((column) => row[column] || "")),
  ]
    .map(
      (row) =>
        `<row>${row
          .map(
            (cell) =>
              `<c t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`,
          )
          .join("")}</row>`,
    )
    .join("");

  return createZip([
    {
      name: "[Content_Types].xml",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    },
    {
      name: "_rels/.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    {
      name: "xl/workbook.xml",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Reports" sheetId="1" r:id="rId1"/></sheets></workbook>',
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
    },
  ]);
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const toReportCodePart = (value: string) =>
  value
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("");

const getReportDisplayId = (report: ReportSubmission) => {
  const projectPart = toReportCodePart(report.projectName) || "REPORT";
  const quarterPart = toReportCodePart(report.quarter) || "QUARTER";
  const submittedYear = new Date(report.createdAt).getFullYear();

  return `${projectPart}-${submittedYear}-${quarterPart}`;
};

const getReportGroupKey = (report: ReportSubmission) =>
  `${report.projectName.toLowerCase()}|${new Date(report.createdAt).getFullYear()}|${report.quarter.toLowerCase()}`;

const getReportDisplayIds = (reports: ReportSubmission[]) => {
  const sortedReports = [...reports].sort((first, second) => {
    const dateComparison =
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return first.id.localeCompare(second.id);
  });
  const groupCounts = new Map<string, number>();
  const displayIds = new Map<string, string>();

  for (const report of sortedReports) {
    const groupKey = getReportGroupKey(report);
    const nextSerial = (groupCounts.get(groupKey) || 0) + 1;
    groupCounts.set(groupKey, nextSerial);
    displayIds.set(
      report.id,
      `${getReportDisplayId(report)}-${String(nextSerial).padStart(3, "0")}`,
    );
  }

  return displayIds;
};

const mapReportToTableRow = (
  report: ReportSubmission,
  displayIds: Map<string, string>,
): ReportsTableReport => {
  const languageField = report.dynamicFields.find((field) =>
    /\blanguage\b/i.test(field.label),
  );
  const languageValue = Array.isArray(languageField?.value)
    ? languageField.value.join(", ")
    : languageField?.value || "-";

  return {
    id: report.id,
    displayId: displayIds.get(report.id) || `${getReportDisplayId(report)}-001`,
    projectName: report.projectName,
    language: languageValue,
    quarter: report.quarter,
    submittedBy: report.createdByUsername,
    status: report.status || "submitted",
    submissionDate: report.createdAt.slice(0, 10),
  };
};

const getReportRows = (reports: ReportSubmission[]) => {
  const displayIds = getReportDisplayIds(reports);

  return reports.map((report) => {
    const row: Record<string, string> = {
      ID: report.id,
      "Report Code":
        displayIds.get(report.id) || `${getReportDisplayId(report)}-001`,
      Project: report.projectName,
      Quarter: report.quarter,
      "Submitted By": report.createdByUsername,
      Status: report.status || "submitted",
      "Submission Date": report.createdAt,
    };

    for (const field of report.dynamicFields) {
      row[field.label] = Array.isArray(field.value)
        ? field.value.join(", ")
        : field.value;
    }

    return row;
  });
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportSubmission[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [searchValue, setSearchValue] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [cycles, setCycles] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingReport, setEditingReport] =
    useState<ReportsTableReport | null>(null);
  const [editStatus, setEditStatus] = useState<ReportStatus>("submitted");
  const [deletingReport, setDeletingReport] =
    useState<ReportsTableReport | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "50");
      if (searchValue) params.set("search", searchValue);
      if (projectFilter !== "all") params.set("project", projectFilter);
      if (quarterFilter !== "all") params.set("quarter", quarterFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (cycleFilter !== "all") params.set("cycleId", cycleFilter);

      const response = await fetch(`/api/reports?${params.toString()}`, { cache: "no-store" });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = (await response.json()) as ReportsResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Unable to load reports.");
        return;
      }

      setReports(data.reports || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch {
      setErrorMessage("Unable to load reports right now.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, projectFilter, quarterFilter, statusFilter, cycleFilter, router]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const res = await fetch("/api/reporting-cycles");
        if (res.ok) {
          const data = await res.json();
          setCycles(data.cycles || []);
        }
      } catch {
        // non-critical
      }
    };
    fetchCycles();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, projectFilter, quarterFilter, statusFilter, cycleFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchValue(searchInput);
  };

  const tableReports = useMemo(() => {
    const displayIds = getReportDisplayIds(reports);
    return reports.map((report) => mapReportToTableRow(report, displayIds));
  }, [reports]);

  const uniqueProjects = Array.from(
    new Set(tableReports.map((report) => report.projectName)),
  ).sort();
  const uniqueQuarters = Array.from(
    new Set(tableReports.map((report) => report.quarter)),
  ).sort();

  const exportReports = async (reportsToExport: ReportsTableReport[]) => {
    const reportIds = new Set(reportsToExport.map((report) => report.id));
    const fullReports = reports.filter((report) => reportIds.has(report.id));
    const rows = getReportRows(fullReports);
    const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

    if (rows.length === 0) {
      return;
    }

    downloadBlob(
      createWorkbookBlob(rows, columns),
      reportsToExport.length === 1
        ? `report-${reportsToExport[0].id}.xlsx`
        : "reports-export.xlsx",
    );
  };

  const updateReportStatus = async () => {
    if (!editingReport) {
      return;
    }

    const response = await fetch(`/api/reports/${editingReport.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus }),
    });
    const data = (await response.json()) as ReportResponse;

    if (!response.ok || !data.report) {
      setErrorMessage(data.message || "Unable to update report.");
      return;
    }

    setReports((prev) =>
      prev.map((report) => (report.id === data.report?.id ? data.report : report)),
    );
    setEditingReport(null);
  };

  const deleteReport = async () => {
    if (!deletingReport) {
      return;
    }

    const response = await fetch(`/api/reports/${deletingReport.id}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setErrorMessage(data.message || "Unable to delete report.");
      return;
    }

    setReports((prev) =>
      prev.filter((report) => report.id !== deletingReport.id),
    );
    setDeletingReport(null);
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <PageHeader
        title="Reports"
        subtitle="View and manage submitted quarterly reports"
        action={
          <Button
            className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
            onClick={() => void exportReports(tableReports)}
            disabled={tableReports.length === 0}
          >
            <Download className="w-4 h-4" />
            Export All
          </Button>
        }
      />

      <ReportsSummary
        reports={tableReports}
        activeSessions={mockActiveSessions}
      />

      <LiveActivity sessions={mockActiveSessions} />

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <Toolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Search by project, quarter, or coordinator..."
        filters={
          <div className="flex gap-2 flex-wrap">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={quarterFilter} onValueChange={setQuarterFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All quarters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quarters</SelectItem>
                {uniqueQuarters.map((quarter) => (
                  <SelectItem key={quarter} value={quarter}>
                    {quarter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={cycleFilter}
              onValueChange={setCycleFilter}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All cycles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cycles</SelectItem>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | ReportStatus)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <ReportsTable
        reports={tableReports}
        isLoading={isLoading}
        onView={(report) => router.push(`/report/${report.id}`)}
        onEdit={(report) => {
          setEditingReport(report);
          setEditStatus(report.status);
        }}
        onDelete={setDeletingReport}
        onExport={(report) => void exportReports([report])}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-slate-600">
          {pagination.total > 0 ? `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} reports` : "No reports"}
        </div>
        {pagination.totalPages > 1 && (
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
        )}
      </div>

      <Dialog
        open={Boolean(editingReport)}
        onOpenChange={(open) => !open && setEditingReport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report Status</DialogTitle>
            <DialogDescription>
              Update the review status for {editingReport?.id}.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={editStatus}
            onValueChange={(value) => setEditStatus(value as ReportStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)}>
              Cancel
            </Button>
            <Button onClick={() => void updateReportStatus()}>
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingReport)}
        onOpenChange={(open) => !open && setDeletingReport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Delete {deletingReport?.id}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingReport(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void deleteReport()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
