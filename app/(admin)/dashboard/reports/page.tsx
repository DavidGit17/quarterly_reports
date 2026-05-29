"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronLeft, ChevronRight, Download } from "lucide-react";

const ReportsSummary = dynamic(
  () =>
    import("@/components/admin/dashboard/reports/reports-summary").then(
      (mod) => ({ default: mod.ReportsSummary }),
    ),
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

  return new Blob([...chunks, ...centralDirectory, endRecord] as BlobPart[], {
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
            (cell) => `<c t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`,
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

const FORM_FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] text-slate-800 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-[rgb(52,118,123)] focus:outline-none focus:ring-0 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";
const FORM_SURFACE_CLASS =
  "rounded-2xl bg-white shadow-sm border border-slate-100";
const FORM_LABEL_CLASS = "block text-[16px] font-medium text-slate-800";
const FORM_REQUIRED_CLASS = "text-red-400 font-semibold";
const FORM_META_CLASS = "text-sm text-slate-500";
const FORM_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-[rgb(52,118,123)] px-6 py-2.5 text-[15px] font-semibold leading-6 text-white transition-all duration-200 hover:bg-[rgb(42,98,102)] focus:outline-none focus:ring-2 focus:ring-[rgb(52,118,123)] active:bg-[rgb(34,82,86)] cursor-pointer";

const getReportGroupKey = (report: ReportSubmission) =>
  `${report.projectName.toLowerCase()}|${new Date(report.createdAt).getFullYear()}|${report.quarter.toLowerCase()}`;

const getReportDisplayIds = (reports: ReportSubmission[]) => {
  const sortedReports = [...reports].sort((first, second) => {
    const dateComparison =
      new Date(first.createdAt).getTime() -
      new Date(second.createdAt).getTime();

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
  const [reports, setReports] = useState<ReportSubmission[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [searchValue, setSearchValue] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewingReport, setViewingReport] = useState<ReportsTableReport | null>(
    null,
  );
  const [editingReport, setEditingReport] = useState<ReportsTableReport | null>(
    null,
  );
  const [editFields, setEditFields] = useState<
    Array<{ fieldId: string; label: string; value: string }>
  >([]);
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
      if (dateFilter) {
        params.set("date", dateFilter);
      } else if (quarterFilter !== "all") {
        params.set("quarter", quarterFilter);
      }

      const response = await fetch(`/api/reports?${params.toString()}`, {
        cache: "no-store",
      });

      if (response.status === 401) {
        return;
      }

      const data = (await response.json()) as ReportsResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Unable to load reports.");
        return;
      }

      setReports(data.reports || []);
      setPagination(
        data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 },
      );
    } catch {
      setErrorMessage("Unable to load reports right now.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, projectFilter, quarterFilter, dateFilter]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, projectFilter, quarterFilter, dateFilter]);

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
    const columns = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row))),
    );

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

  const openViewModal = (report: ReportsTableReport) => {
    setViewingReport(report);
  };

  const openEditModal = (report: ReportsTableReport) => {
    const fullReport = reports.find((r) => r.id === report.id);
    if (fullReport) {
      setEditFields(
        fullReport.dynamicFields.map((f) => ({
          fieldId: f.fieldId,
          label: f.label,
          value: Array.isArray(f.value) ? f.value.join(", ") : f.value,
        })),
      );
    }
    setEditingReport(report);
  };

  const updateField = (fieldId: string, value: string) => {
    setEditFields((prev) =>
      prev.map((f) => (f.fieldId === fieldId ? { ...f, value } : f)),
    );
  };

  const saveEditResponses = async () => {
    if (!editingReport) return;

    const dynamicFields = editFields.map((f) => ({
      fieldId: f.fieldId,
      label: f.label,
      value: f.value,
    }));

    const response = await fetch(`/api/reports/${editingReport.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dynamicFields }),
    });
    const data = (await response.json()) as ReportResponse;

    if (!response.ok || !data.report) {
      setErrorMessage(data.message || "Unable to update report.");
      return;
    }

    setReports((prev) =>
      prev.map((report) =>
        report.id === data.report?.id ? data.report : report,
      ),
    );
    setEditingReport(null);
    setEditFields([]);
  };

  const viewingReportData = viewingReport
    ? reports.find((r) => r.id === viewingReport.id)
    : null;

  return (
    <main className="flex-1 p-4 md:p-6">
      <PageHeader
        title="Reports"
        subtitle="View and manage submitted quarterly reports"
        action={
          <Button
            className="bg-[#2563EB] hover:bg-blue-700 text-white gap-2"
            onClick={() => void exportReports(tableReports)}
            disabled={tableReports.length === 0}
          >
            <Download className="w-4 h-4" />
            Export All
          </Button>
        }
      />

      <ReportsSummary reports={tableReports} />

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <Toolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Search by project, quarter, or coordinator..."
        searchInputClassName="caret-[rgb(52,118,123)] focus:ring-2 focus:ring-[rgb(52,118,123)] focus:border-[rgb(52,118,123)] text-[17px] leading-7"
        filters={
          <div className="flex gap-2 flex-wrap">
            {/* Projects dropdown — separate */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Search by Project" />
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

            {/* Quarter / Date dropdown */}
            <Select value="filters" onValueChange={() => {}}>
              <SelectTrigger className="w-[260px]">
                <SelectValue>
                  Quarter / Date
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <div className="grid grid-cols-2 gap-5 p-3 min-w-[460px] max-w-[460px]">
                  <div>
                    <div className="mb-3 text-xs font-semibold text-slate-500">
                      Quarter
                    </div>

                    <div className="space-y-1 max-h-[220px] overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setQuarterFilter("all")}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${quarterFilter === "all" ? "bg-slate-100 font-medium" : ""}`}
                      >
                        All Quarters
                      </button>

                      {uniqueQuarters.map((quarter) => (
                        <button
                          key={quarter}
                          type="button"
                          onClick={() => setQuarterFilter(quarter)}
                          className={`w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${quarterFilter === quarter ? "bg-slate-100 font-medium" : ""}`}
                        >
                          {quarter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-xs font-semibold text-slate-500">
                      Date
                    </div>

                    <div className="space-y-3">
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-[rgba(107,114,128,0.18)] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded-xl [&::-webkit-calendar-picker-indicator]:p-1.5 [&::-webkit-calendar-picker-indicator]:opacity-75 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                      />
                      <style jsx>{`
                        input[type="date"] {
                          color-scheme: light;
                          accent-color: #6b7280;
                        }

                        input[type="date"]::-webkit-calendar-picker-indicator {
                          filter: grayscale(1) opacity(0.75);
                        }
                      `}</style>

                      <button
                        type="button"
                        onClick={() => setDateFilter("")}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        Clear Date Filter
                      </button>
                    </div>
                  </div>
                </div>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <ReportsTable
        reports={tableReports}
        isLoading={isLoading}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={setDeletingReport}
        onExport={(report) => void exportReports([report])}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-slate-600">
          {pagination.total > 0
            ? `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} reports`
            : "No reports"}
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

      {/* View Report Modal */}
      <Dialog
        open={Boolean(viewingReport)}
        onOpenChange={(open) => !open && setViewingReport(null)}
      >
        <DialogContent className="!w-[82vw] !max-w-[82vw] max-h-[95vh] overflow-y-auto bg-[#f8f9fa] border-none p-0 shadow-none">
          <DialogTitle className="sr-only">
            {viewingReport?.displayId || "Report Details"}
          </DialogTitle>

          {viewingReportData && (
            <div className="min-h-screen">
              <div className="w-full max-w-none px-10 py-10">
                <div className={`${FORM_SURFACE_CLASS} p-8 mb-6`}>
                  <div className="flex items-center justify-between mb-6">
                    <button
                      type="button"
                      onClick={() => setViewingReport(null)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5e6a6e] transition-colors hover:text-[#4b6358]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Reports
                    </button>
                  </div>

                  <h2 className="mb-2 font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d] sm:text-[30px] sm:leading-10 sm:tracking-[-0.02em]">
                    {viewingReport?.displayId}
                  </h2>

                  <h3 className="mb-6 font-heading text-[20px] font-medium leading-7 text-[#191c1d]">
                    Quarterly Reports
                  </h3>

                  <p className="mb-5 font-ui text-[16px] leading-6 text-[#424845]">
                    Full report details and submitted responses.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className={`${FORM_SURFACE_CLASS} p-6`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                      <div>
                        <p className={`${FORM_LABEL_CLASS} mb-2`}>Project</p>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] font-medium text-slate-700">
                          {viewingReportData.projectName}
                        </p>
                      </div>

                      <div>
                        <p className={`${FORM_LABEL_CLASS} mb-2`}>Quarter</p>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] font-medium text-slate-700">
                          {viewingReportData.quarter}
                        </p>
                      </div>

                      <div>
                        <p className={`${FORM_LABEL_CLASS} mb-2`}>Submitted By</p>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] font-medium text-slate-700">
                          {viewingReportData.createdByUsername}
                        </p>
                      </div>

                      <div>
                        <p className={`${FORM_LABEL_CLASS} mb-2`}>Submission Date</p>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] font-medium text-slate-700">
                          {viewingReportData.createdAt.slice(0, 10)}
                        </p>
                      </div>
                    </div>

                    {viewingReportData.dynamicFields.map((field) => (
                      <div key={field.fieldId} className="pt-6">
                        <label className={`${FORM_LABEL_CLASS} mb-3`}>
                          {field.label.replace(/^(\d+)\./, "$1. ")}
                        </label>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] text-slate-800 break-words whitespace-pre-wrap">
                          {Array.isArray(field.value)
                            ? field.value.join(", ")
                            : field.value}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col sm:flex-row gap-4 pt-8">
                      <button
                        type="button"
                        onClick={() => setViewingReport(null)}
                        className={FORM_PRIMARY_BUTTON_CLASS}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Report Responses Modal */}
      <Dialog
        open={Boolean(editingReport)}
        onOpenChange={(open) =>
          !open && (setEditingReport(null), setEditFields([]))
        }
      >
        <DialogContent className="!w-[82vw] !max-w-[82vw] max-h-[95vh] overflow-y-auto bg-[#f8f9fa] border-none p-0 shadow-none">
          <DialogTitle className="sr-only">
            {editingReport
              ? `Edit ${editingReport.projectName} Report`
              : "Edit Report"}
          </DialogTitle>
          <div className="min-h-screen">
            <div className="w-full max-w-none px-10 py-10">
              <div className={`${FORM_SURFACE_CLASS} p-8 mb-6`}>
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReport(null);
                      setEditFields([]);
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5e6a6e] transition-colors hover:text-[#4b6358]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Reports
                  </button>
                </div>
                <h2 className="mb-2 font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d] sm:text-[30px] sm:leading-10 sm:tracking-[-0.02em]">
                  {editingReport
                    ? `${editingReport.projectName} ${editingReport.quarter} ${new Date(editingReport.submissionDate).getFullYear()} Reports`
                    : "Edit Responses"}
                </h2>
                <h3 className="mb-6 font-heading text-[20px] font-medium leading-7 text-[#191c1d]">
                  Quarterly Reports
                </h3>
                <p className="mb-5 font-ui text-[16px] leading-6 text-[#424845]">
                  Update the submitted form responses for this report.
                </p>
                <p className="font-data text-[12px] font-medium leading-4 text-[#424845]">
                  <span className={FORM_REQUIRED_CLASS}>*</span> Required
                </p>
              </div>

              <div className="space-y-6">
                <div className={`${FORM_SURFACE_CLASS} p-6`}>
                  <div className="pb-6">
                    <p className={`${FORM_LABEL_CLASS} mb-2`}>Quarter</p>
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] font-medium text-slate-700">
                      {editingReport?.quarter || "-"}
                    </p>
                  </div>

                  {editFields.length === 0 ? (
                    <div className="pt-6">
                      <p className={FORM_META_CLASS}>
                        No responses are available for this report yet.
                      </p>
                    </div>
                  ) : (
                    editFields.map((field) => (
                      <div key={field.fieldId} className="pt-6">
                        <label className={`${FORM_LABEL_CLASS} mb-3`}>
  {field.label.replace(/^(\d+)\./, "$1. ")}{" "}
  <span className={FORM_REQUIRED_CLASS}>*</span>
</label>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) =>
                            updateField(field.fieldId, e.target.value)
                          }
                          onFocus={(e) => {
                            const value = e.target.value;
                            requestAnimationFrame(() => {
                              e.target.setSelectionRange(
                                value.length,
                                value.length,
                              );
                            });
                          }}
                          className={FORM_FIELD_CLASS}
                          placeholder="Enter your answer"
                        />
                      </div>
                    ))
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReport(null);
                        setEditFields([]);
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3 text-[16px] font-semibold leading-6 text-slate-600 transition-all duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004446] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={FORM_PRIMARY_BUTTON_CLASS}
                      onClick={() => void saveEditResponses()}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
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
