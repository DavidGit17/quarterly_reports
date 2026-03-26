"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X } from "lucide-react";
import {
  type FormFieldConfig,
  getFormConfigs,
  getProjectConfig,
} from "@/lib/form-storage";

type FieldValueMap = Record<string, string>;
type FileValueMap = Record<string, File[]>;

type MeResponse = {
  user?: {
    role: "admin" | "coordinator";
  };
};

type CreateReportResponse = {
  message?: string;
};

function SubmitReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedProject = searchParams.get("project") || "";
  const quarter = searchParams.get("quarter") || "";

  const [projectName, setProjectName] = useState(selectedProject);
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [formValues, setFormValues] = useState<FieldValueMap>({});
  const [fileValues, setFileValues] = useState<FileValueMap>({});
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const submitRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const verifyCoordinator = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const data = (await response.json()) as MeResponse;

        if (data.user?.role !== "coordinator") {
          router.push("/dashboard");
          return;
        }

        setIsReady(true);
      } catch {
        setErrorMessage("Unable to verify your account.");
      }
    };

    void verifyCoordinator();
  }, [router]);

  useEffect(() => {
    const configs = getFormConfigs();
    const projectFields = getProjectConfig(projectName, configs);
    setFields(projectFields);
  }, [projectName]);

  useEffect(() => {
    setFormValues((prev) => {
      const next: FieldValueMap = {};

      fields.forEach((field) => {
        if (field.type !== "file") {
          next[field.id] = prev[field.id] || "";
        }
      });

      return next;
    });

    setFileValues((prev) => {
      const next: FileValueMap = {};
      fields.forEach((field) => {
        if (field.type === "file") {
          next[field.id] = prev[field.id] || [];
        }
      });
      return next;
    });
  }, [fields]);

  const handleTextChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const syncFileInput = (
    inputElement: HTMLInputElement | null,
    files: File[],
  ) => {
    if (!inputElement) {
      return;
    }

    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    inputElement.files = dataTransfer.files;
  };

  const handleFileChange = (fieldId: string, files: FileList | null) => {
    const selectedFiles = Array.from(files || []).slice(0, 10);
    setFileValues((prev) => ({ ...prev, [fieldId]: selectedFiles }));
  };

  const removeUploadedFile = (fieldId: string, fileIndex: number) => {
    setFileValues((prev) => {
      const currentFiles = prev[fieldId] || [];
      const updatedFiles = currentFiles.filter(
        (_, index) => index !== fileIndex,
      );
      syncFileInput(fileInputRefs.current[fieldId], updatedFiles);
      return { ...prev, [fieldId]: updatedFiles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    const dynamicFields = fields.map((field) => ({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value:
        field.type === "file"
          ? (fileValues[field.id] || []).map((file) => file.name)
          : formValues[field.id] || "",
    }));

    const fieldsPayload = dynamicFields.reduce<
      Record<string, string | string[]>
    >((acc, field) => {
      acc[field.fieldId] = field.value;
      return acc;
    }, {});

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          quarter,
          fields: fieldsPayload,
          dynamicFields,
        }),
      });

      const data = (await response.json()) as CreateReportResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to submit report.");
        return;
      }

      setShowSubmitPopup(true);

      if (submitRedirectTimerRef.current) {
        clearTimeout(submitRedirectTimerRef.current);
      }

      submitRedirectTimerRef.current = setTimeout(() => {
        router.push("/my-reports");
      }, 1800);
    } catch {
      setErrorMessage("Unable to submit report right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToHistory = () => {
    if (submitRedirectTimerRef.current) {
      clearTimeout(submitRedirectTimerRef.current);
    }
    router.push("/my-reports");
  };

  const displayProject = projectName.trim() || "Project";
  const displayQuarter = quarter.trim() || "Quarter";

  if (!isReady && !errorMessage) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/select"
            className="text-sky-700 hover:underline text-sm font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Quarterly Report Submission
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-6">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
            {displayProject} {displayQuarter} Reports
          </h2>
          <p className="text-base text-slate-700">
            Complete the form fields for this selected project.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <label
              htmlFor="projectName"
              className="block text-base font-semibold text-slate-900 mb-2"
            >
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
              placeholder="Enter project name"
            />
          </div>

          {fields.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <p className="text-sm text-slate-600">
                No form is configured for this project yet. Please ask admin to
                create fields.
              </p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <label className="block text-base font-semibold text-slate-900 mb-3">
                  {index + 1}. {field.label}{" "}
                  {field.required !== false && (
                    <span className="text-red-600">*</span>
                  )}
                </label>

                {field.type === "text" && (
                  <input
                    type="text"
                    required={field.required !== false}
                    value={formValues[field.id] || ""}
                    onChange={(e) => handleTextChange(field.id, e.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                    placeholder="Enter your answer"
                  />
                )}

                {field.type === "number" && (
                  <input
                    type="number"
                    required={field.required !== false}
                    value={formValues[field.id] || ""}
                    onChange={(e) => handleTextChange(field.id, e.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                    placeholder="Enter number"
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    required={field.required !== false}
                    value={formValues[field.id] || ""}
                    onChange={(e) => handleTextChange(field.id, e.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 placeholder:text-slate-400 min-h-24 resize-y focus:outline-none focus:border-sky-600"
                    placeholder="Enter your answer"
                  />
                )}

                {field.type === "file" && (
                  <div className="space-y-4">
                    <label
                      htmlFor={`file-${field.id}`}
                      className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold cursor-pointer"
                    >
                      <Upload className="h-4 w-4" /> Upload file
                    </label>
                    <input
                      id={`file-${field.id}`}
                      ref={(element) => {
                        fileInputRefs.current[field.id] = element;
                      }}
                      type="file"
                      multiple
                      required={field.required !== false}
                      onChange={(e) =>
                        handleFileChange(field.id, e.target.files)
                      }
                      className="sr-only"
                    />

                    {(fileValues[field.id] || []).length > 0 && (
                      <div className="space-y-2">
                        {(fileValues[field.id] || []).map((file, fileIndex) => (
                          <div
                            key={`${field.id}-${file.name}-${fileIndex}`}
                            className="flex items-center justify-between gap-3 text-sm text-slate-800"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                removeUploadedFile(field.id, fileIndex)
                              }
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-4 w-4" /> Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={fields.length === 0 || isSubmitting}
              className="flex-1 bg-sky-700 text-white py-3 rounded-md font-medium hover:bg-sky-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <Link
              href="/select"
              className="flex-1 bg-slate-200 text-slate-900 py-3 rounded-md font-medium text-center hover:bg-slate-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {showSubmitPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Report submitted successfully
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                Redirecting to submitted reports history...
              </p>
              <button
                type="button"
                onClick={handleGoToHistory}
                className="w-full bg-sky-700 text-white py-2.5 rounded-md font-medium hover:bg-sky-800 transition-colors"
              >
                Go to History now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubmitReportPage() {
  return (
    <Suspense>
      <SubmitReportContent />
    </Suspense>
  );
}
