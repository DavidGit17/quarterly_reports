"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDateTime, type DynamicFieldType } from "@/lib/form-storage";

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
          router.push("/login");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-white rounded-lg border border-border p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Report not found
          </h1>
          <p className="text-muted-foreground mb-6">
            {errorMessage || "This report does not exist."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/my-reports")}
            className="text-secondary hover:underline font-medium"
          >
            Return to My Reports
          </button>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(report.createdAt);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-secondary hover:underline"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-primary">Report Details</h1>
        </div>

        <div className="bg-white rounded-lg border border-border p-8 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">
                Project
              </p>
              <p className="font-semibold text-foreground">
                {report.projectName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">
                Quarter
              </p>
              <p className="font-semibold text-foreground">{report.quarter}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">
                Submitted By
              </p>
              <p className="font-semibold text-foreground">
                {report.createdByUsername}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">
                Date & Time
              </p>
              <p className="font-semibold text-foreground">
                {date} {time}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Report Content
          </h2>
          {report.dynamicFields.map((field, index) => (
            <div
              key={`${field.fieldId}-${index}`}
              className="bg-white rounded-lg border border-border p-6"
            >
              <h3 className="text-sm font-semibold text-primary mb-3">
                {index + 1}. {field.label}
              </h3>
              {Array.isArray(field.value) ? (
                field.value.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                    {field.value.map((fileName) => (
                      <li key={fileName}>{fileName}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No files uploaded.
                  </p>
                )
              ) : (
                <p className="text-sm text-foreground leading-relaxed">
                  {field.value || "-"}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-muted text-foreground py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportDetailsPage() {
  return (
    <Suspense>
      <ReportDetailsContent />
    </Suspense>
  );
}
