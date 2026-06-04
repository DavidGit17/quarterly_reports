"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  formatDateTime,
  type DynamicFieldType,
} from "@/lib/shared/form-storage";

type ReportSubmission = {
  id: string;
  projectName: string;
  quarter: string;
  createdByUsername: string;
  createdAt: string;
  dynamicFields: Array<{
    fieldId: string;
    label: string;
    type: DynamicFieldType;
    value: string | string[];
  }>;
};

type ReportResponse = {
  report?: ReportSubmission;
  message?: string;
};

function ReportDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [report, setReport] = useState<ReportSubmission | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await fetch(`/api/reports/${reportId}`, {
          cache: "no-store",
        });

        if (response.status === 401) {
          router.push("/auth");
          return;
        }

        const data = (await response.json()) as ReportResponse;

        if (!response.ok || !data.report) {
          setErrorMessage(data.message || "Report not found.");
          return;
        }

        setReport(data.report);
      } catch {
        setErrorMessage("Unable to load report details right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadReport();
  }, [reportId, router]);

  if (isLoading) {
    return (
      <div className="coordinator-system min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="mb-8">
            <div className="h-4 w-16 bg-slate-200 rounded mb-3" />
            <div className="h-8 w-48 bg-slate-200 rounded" />
          </div>
          <div className="si-surface p-8 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="si-surface p-6">
                <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
                <div className="h-4 w-full bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="coordinator-system min-h-screen flex items-center justify-center">
        <div className="si-surface p-8 max-w-md text-center">
          <h1 className="mb-4 font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-foreground">
            Report not found
          </h1>
          <p className="mb-6 font-ui text-[14px] leading-5 text-muted-foreground">
            {errorMessage || "This report does not exist."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/f/my-reports")}
            className="font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-primary"
          >
            Return to My Reports
          </button>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(report.createdAt);

  return (
    <div className="coordinator-system min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-3 font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-primary"
          >
            ← Back
          </button>
          <h1 className="font-heading text-[30px] font-semibold leading-10 tracking-[-0.02em] text-foreground">
            Report Details
          </h1>
        </div>

        <div className="si-surface p-8 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="mb-1 font-data text-[12px] font-medium uppercase leading-4 text-muted-foreground">
                Project
              </p>
              <p className="font-ui text-[14px] font-semibold leading-5 text-foreground">
                {report.projectName}
              </p>
            </div>
            <div>
              <p className="mb-1 font-data text-[12px] font-medium uppercase leading-4 text-muted-foreground">
                Quarter
              </p>
              <p className="font-ui text-[14px] font-semibold leading-5 text-foreground">
                {report.quarter}
              </p>
            </div>
            <div>
              <p className="mb-1 font-data text-[12px] font-medium uppercase leading-4 text-muted-foreground">
                Submitted By
              </p>
              <p className="font-ui text-[14px] font-semibold leading-5 text-foreground">
                {report.createdByUsername}
              </p>
            </div>
            <div>
              <p className="mb-1 font-data text-[12px] font-medium uppercase leading-4 text-muted-foreground">
                Date & Time
              </p>
              <p className="font-data text-[13px] leading-[18px] text-foreground">
                {date} {time}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h2 className="mb-4 font-heading text-[20px] font-medium leading-7 text-foreground">
            Report Content
          </h2>
          {report.dynamicFields.map((field, index) => (
            <div
              key={`${field.fieldId}-${index}`}
              className="si-surface p-6"
            >
              <h3 className="mb-3 font-ui text-[14px] font-semibold leading-5 text-foreground">
                {field.label}
              </h3>
              {Array.isArray(field.value) ? (
                field.value.length > 0 ? (
                  <ul className="list-disc list-inside font-ui text-[14px] leading-5 text-foreground space-y-1">
                    {field.value.map((fileName) => (
                      <li key={fileName}>{fileName}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-ui text-[14px] leading-5 text-muted-foreground">
                    No files uploaded.
                  </p>
                )
              ) : (
                <p className="font-ui text-[14px] leading-6 text-foreground">
                  {field.value || "-"}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="si-secondary-action flex-1 py-3 font-ui text-[14px] font-medium leading-5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FacilitatorReportDetailsPage() {
  return (
    <Suspense>
      <ReportDetailsContent />
    </Suspense>
  );
}
