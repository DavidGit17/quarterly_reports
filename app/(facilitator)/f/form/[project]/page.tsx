"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleUserRound,
  Eye,
  Star,
  Upload,
  X,
} from "lucide-react";
import {
  BIBLE_BOOKS,
  getHydratedFormState,
  getProjectNameFromSlug,
  toProjectSlug,
  type FormFieldConfig,
} from "@/lib/shared/form-storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldValueMap = Record<string, string>;
type FileValueMap = Record<string, File[]>;
type UploadingMap = Record<string, boolean>;
type UploadProgressMap = Record<string, number>;

type MeResponse = {
  user?: {
    id?: string;
    role: "admin" | "coordinator" | "facilitator";
    project?: string;
    username?: string;
    profileImage?: string;
  };
  message?: string;
};

type CreateReportResponse = {
  message?: string;
};

const getQuarterLabel = (startMonth: string, endMonth: string) =>
  `${startMonth} - ${endMonth}`;
const fileAcceptTypes =
  ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,image/*,video/*,audio/*";
const FORM_FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] text-slate-800 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";
const FORM_DATE_FIELD_CLASS = `${FORM_FIELD_CLASS} pr-12`;
const FORM_CUSTOM_SELECT_TRIGGER_CLASS =
  "h-auto w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] text-slate-800 shadow-none transition-all duration-200 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 data-[placeholder]:text-slate-400";
const FORM_CUSTOM_SELECT_CONTENT_CLASS =
  "rounded-xl border border-slate-100 bg-white text-slate-800 shadow-lg";
const FORM_CUSTOM_SELECT_ITEM_CLASS =
  "cursor-pointer rounded-lg py-2 pl-8 pr-3 text-[14px] text-slate-700 transition-colors duration-150 focus:bg-blue-50 focus:text-blue-800 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white";
const FORM_SURFACE_CLASS = "rounded-2xl bg-white shadow-sm border border-slate-100";
const FORM_LABEL_CLASS =
  "block text-[16px] font-medium text-slate-800";
const FORM_REQUIRED_CLASS = "text-red-400 font-semibold";
const FORM_META_CLASS =
  "text-sm text-slate-500";
const FORM_LINK_CLASS =
  "text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-700";
const FORM_ICON_BUTTON_CLASS =
  "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 hover:text-slate-600 cursor-pointer";
const FORM_SECONDARY_ACTION_CLASS =
  "text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-700 cursor-pointer";
const FORM_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-[#4b6358] px-8 py-3 text-[16px] font-semibold leading-6 text-white transition-all duration-200 hover:bg-[#344b41] focus:outline-none focus:ring-2 focus:ring-[#cee9db] active:bg-[#2a3d35] cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed";

const formatDateInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 8);

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
};

const toDisplayDate = (isoDate: string) => {
  const parts = isoDate.split("-");

  if (parts.length !== 3) {
    return "";
  }

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const isDateField = (field: FormFieldConfig) => /\bdate\b/i.test(field.label);

export default function FacilitatorProjectFormPage() {
  const router = useRouter();
  const params = useParams<{ project: string }>();
  const projectSlug = (params?.project || "").toString().toLowerCase();

  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [quarter, setQuarter] = useState("");
  const [projectName, setProjectName] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("Facilitator");
  const [formValues, setFormValues] = useState<FieldValueMap>({});
  const [fileValues, setFileValues] = useState<FileValueMap>({});
  const [uploadingFiles, setUploadingFiles] = useState<UploadingMap>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgressMap>({});
  const [pendingFiles, setPendingFiles] = useState<FileValueMap>({});
  const [ratingPreviewValues, setRatingPreviewValues] =
    useState<FieldValueMap>({});
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeCycleId, setActiveCycleId] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const nativeDateInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const submitRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const uploadTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const uploadIntervalsRef = useRef<
    Record<string, ReturnType<typeof setInterval>>
  >({});

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        setIsAccessDenied(false);
        setIsPreviewMode(false);
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const data = (await response.json()) as MeResponse;
        const isAdmin = data.user?.role === "admin";

        if (data.user?.role !== "facilitator" && !isAdmin) {
          setIsAccessDenied(true);
          setErrorMessage("Access Denied");
          setIsReady(true);
          return;
        }

        if (isAdmin) {
          setIsPreviewMode(true);
        }

        if (data.user?.role === "facilitator") {
          const username = data.user.username?.trim();

          if (username) {
            setCoordinatorName(username);
          }

          const assignedProject = data.user.project || "";

          if (!assignedProject) {
            setIsAccessDenied(true);
            setErrorMessage("Access Denied");
            setIsReady(true);
            return;
          }

          if (toProjectSlug(assignedProject) !== projectSlug) {
            setIsAccessDenied(true);
            setErrorMessage("Access Denied");
            setIsReady(true);
            return;
          }
        }

        const {
          defaultFields: baseDefaultFields,
          customConfigs: customFormConfigs,
          formConfigs: configs,
          quarterConfigs: projectQuarters,
        } = await getHydratedFormState();

        const projectFromSlug = getProjectNameFromSlug(projectSlug, configs);
        const normalizedProject = projectFromSlug || projectSlug;

        setProjectName(normalizedProject);

        try {
          const cycleRes = await fetch(
            `/api/reporting-cycles?status=active&project=${encodeURIComponent(normalizedProject)}`,
          );
          const cycleData = await cycleRes.json();
          const activeCycle = (cycleData.cycles || [])[0];
          if (activeCycle) {
            setActiveCycleId(activeCycle.id);
          }
        } catch {
          // allow form to proceed if cycle API fails
        }

        const projectCustomFields = customFormConfigs[normalizedProject] || [];
        const defaultFieldIds = new Set(
          baseDefaultFields.map((field) => field.id),
        );

        const filteredCustomFields = projectCustomFields.filter(
          (field) =>
            !defaultFieldIds.has(field.id) &&
            !["region-name", "team-size", "main-project-update"].includes(
              field.id,
            ),
        );

        let projectFields = [...baseDefaultFields, ...filteredCustomFields];

        projectFields = projectFields.map((field, projectIndex) => {
          const position = projectIndex + 1;
          const cleanLabel = field.label.replace(/^(\d+)\.\s*(\d+\.\s*)?/, "");
          return {
            ...field,
            label: `${position}. ${cleanLabel}`,
          };
        });

        const quarterConfig = projectQuarters[normalizedProject] || {
          startMonth: "January",
          endMonth: "March",
        };
        const quarterLabel = getQuarterLabel(
          quarterConfig.startMonth,
          quarterConfig.endMonth,
        );

        setFields(projectFields);
        setQuarter(quarterLabel);
        setIsReady(true);
      } catch {
        setErrorMessage("Unable to verify your account.");
      }
    };

    void verifyAccess();
  }, [projectSlug, router]);

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
    setUploadingFiles((prev) => {
      const next: UploadingMap = {};
      fields.forEach((field) => {
        if (field.type === "file") {
          next[field.id] = prev[field.id] || false;
        }
      });
      return next;
    });
    setUploadProgress((prev) => {
      const next: UploadProgressMap = {};
      fields.forEach((field) => {
        if (field.type === "file") {
          next[field.id] = prev[field.id] || 0;
        }
      });
      return next;
    });
    setPendingFiles((prev) => {
      const next: FileValueMap = {};
      fields.forEach((field) => {
        if (field.type === "file") {
          next[field.id] = prev[field.id] || [];
        }
      });
      return next;
    });
  }, [fields]);

  useEffect(() => {
    return () => {
      Object.values(uploadTimersRef.current).forEach((timer) =>
        clearTimeout(timer),
      );
      Object.values(uploadIntervalsRef.current).forEach((interval) =>
        clearInterval(interval),
      );
    };
  }, []);

  const handleTextChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleDateChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: formatDateInput(value) }));
  };

  const openDatePicker = (fieldId: string) => {
    const inputElement = nativeDateInputRefs.current[fieldId];

    if (!inputElement) {
      return;
    }

    if (typeof inputElement.showPicker === "function") {
      inputElement.showPicker();
      return;
    }

    inputElement.focus();
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
    if (selectedFiles.length === 0) {
      return;
    }

    if (uploadTimersRef.current[fieldId]) {
      clearTimeout(uploadTimersRef.current[fieldId]);
    }
    if (uploadIntervalsRef.current[fieldId]) {
      clearInterval(uploadIntervalsRef.current[fieldId]);
    }

    setPendingFiles((prev) => ({ ...prev, [fieldId]: selectedFiles }));
    setUploadingFiles((prev) => ({ ...prev, [fieldId]: true }));
    setUploadProgress((prev) => ({ ...prev, [fieldId]: 0 }));

    uploadIntervalsRef.current[fieldId] = setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[fieldId] ?? 0;
        const nextValue = Math.min(current + 8 + Math.random() * 10, 90);
        return { ...prev, [fieldId]: nextValue };
      });
    }, 200);

    uploadTimersRef.current[fieldId] = setTimeout(
      () => {
        if (uploadIntervalsRef.current[fieldId]) {
          clearInterval(uploadIntervalsRef.current[fieldId]);
        }
        setUploadProgress((prev) => ({ ...prev, [fieldId]: 100 }));
        setFileValues((prev) => ({ ...prev, [fieldId]: selectedFiles }));
        setPendingFiles((prev) => ({ ...prev, [fieldId]: [] }));
        setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
        syncFileInput(fileInputRefs.current[fieldId], selectedFiles);
      },
      2000 + Math.random() * 1000,
    );
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

  const clearUploadedFiles = (fieldId: string) => {
    if (uploadTimersRef.current[fieldId]) {
      clearTimeout(uploadTimersRef.current[fieldId]);
    }
    if (uploadIntervalsRef.current[fieldId]) {
      clearInterval(uploadIntervalsRef.current[fieldId]);
    }
    setFileValues((prev) => {
      syncFileInput(fileInputRefs.current[fieldId], []);
      return { ...prev, [fieldId]: [] };
    });
    setPendingFiles((prev) => ({ ...prev, [fieldId]: [] }));
    setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
    setUploadProgress((prev) => ({ ...prev, [fieldId]: 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPreviewMode) return;

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
          ...(activeCycleId ? { cycleId: activeCycleId } : {}),
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
        router.push("/f");
      }, 1800);
    } catch {
      setErrorMessage("Unable to submit report right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    if (submitRedirectTimerRef.current) {
      clearTimeout(submitRedirectTimerRef.current);
    }
    router.push("/f");
  };

  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear(),
  );

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const quarterRange = quarter || "January - March";

  if (!isReady && !errorMessage) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-4 w-16 bg-slate-200 rounded mb-6" />
          <div className={`${FORM_SURFACE_CLASS} p-8 mb-6`}>
            <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-64 bg-slate-200 rounded mb-4" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          <div className={`${FORM_SURFACE_CLASS} p-8 mb-6`}>
            <div className="h-5 w-36 bg-slate-200 rounded mb-3" />
            <div className="h-10 w-full bg-slate-200 rounded" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${FORM_SURFACE_CLASS} p-6 mb-4`}>
              <div className="h-5 w-48 bg-slate-200 rounded mb-3" />
              <div className="h-10 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="coordinator-system min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4">
        <div className={`${FORM_SURFACE_CLASS} p-8 w-full max-w-md text-center`}>
          <h1 className="mb-3 font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d]">
            Access Denied
          </h1>
          <p className={`${FORM_META_CLASS} mb-5`}>
            You can only access the form for your assigned project.
          </p>
          <Link
            href="/login"
            className={FORM_LINK_CLASS}
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {isPreviewMode && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Preview Mode
              </p>
              <p className="text-xs font-medium text-blue-600">
                You are viewing this form as an admin. This is a read-only
                preview.
              </p>
            </div>
          </div>
        )}

        <div className={`${FORM_SURFACE_CLASS} p-8 mb-6`}>
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => router.push("/f")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5e6a6e] transition-colors hover:text-[#4b6358]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            {!isPreviewMode && (
              <Link
                href="/profile"
                className="inline-flex items-center text-[#5e6a6e] transition-colors hover:text-[#4b6358]"
                aria-label="Go to profile"
                title="Profile"
              >
                <CircleUserRound className="h-6 w-6" />
              </Link>
            )}
          </div>
          <h2 className="mb-2 font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d] sm:text-[30px] sm:leading-10 sm:tracking-[-0.02em]">
            {projectName} {quarterRange} {currentYear} Reports
          </h2>
          <h3 className="mb-6 font-heading text-[20px] font-medium leading-7 text-[#191c1d]">
            Quarterly Reports
          </h3>
          {!isPreviewMode && (
            <p className="mb-5 font-ui text-[16px] leading-6 text-[#424845]">
              Hi, {coordinatorName}. When you submit this form, the owner will
              see your name and email address.
            </p>
          )}
          <p className="font-data text-[12px] font-medium leading-4 text-[#424845]">
            <span className={FORM_REQUIRED_CLASS}>*</span> Required
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onInvalid={() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="space-y-6"
        >
          {errorMessage && (
            <div className="rounded-lg border border-[#ffdad6] bg-[#ffdad6]/50 p-4">
              <p className="font-ui text-[14px] leading-5 text-[#93000a]">
                {errorMessage}
              </p>
            </div>
          )}

          <div className={`${FORM_SURFACE_CLASS} p-6`}>
            <div className="pb-6">
              <p className={`${FORM_LABEL_CLASS} mb-2`}>
                Quarter
              </p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] font-medium text-slate-700">
                {quarterRange}
              </p>
            </div>

            {fields.length === 0 ? (
              <div className="pt-6">
                <p className={FORM_META_CLASS}>
                  No form is configured for this project yet. Please ask admin
                  to create fields.
                </p>
              </div>
            ) : (
              fields.map((field) => (
                <div key={field.id} className="pt-6">
                  <label className={`${FORM_LABEL_CLASS} mb-3`}>
                    {field.label}{" "}
                    {field.required !== false && (
                      <span className={FORM_REQUIRED_CLASS}>*</span>
                    )}
                  </label>

                  {field.type === "text" &&
                    (isDateField(field) ? (
                      <div className="relative">
                        <input
                          type="text"
                          required={field.required !== false}
                          value={formValues[field.id] || ""}
                          onChange={(e) =>
                            handleDateChange(field.id, e.target.value)
                          }
                          className={FORM_DATE_FIELD_CLASS}
                          placeholder="dd/mm/yyyy"
                          maxLength={10}
                          inputMode="numeric"
                        />
                        <input
                          ref={(element) => {
                            nativeDateInputRefs.current[field.id] = element;
                          }}
                          type="date"
                          className="sr-only"
                          onChange={(e) =>
                            handleDateChange(
                              field.id,
                              toDisplayDate(e.target.value),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openDatePicker(field.id)}
                          className={FORM_ICON_BUTTON_CLASS}
                          aria-label="Open calendar"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        required={field.required !== false}
                        value={formValues[field.id] || ""}
                        onChange={(e) =>
                          handleTextChange(field.id, e.target.value)
                        }
                        className={FORM_FIELD_CLASS}
                        placeholder="Enter your answer"
                      />
                    ))}

                  {field.type === "choice" && (
                    <Select
                      name={field.id}
                      required={field.required !== false}
                      value={formValues[field.id] || undefined}
                      onValueChange={(value) =>
                        handleTextChange(field.id, value)
                      }
                    >
                      <SelectTrigger
                        className={FORM_CUSTOM_SELECT_TRIGGER_CLASS}
                      >
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent
                        className={FORM_CUSTOM_SELECT_CONTENT_CLASS}
                      >
                        {field.choices?.map((choice) => (
                          <SelectItem
                            key={choice}
                            value={choice}
                            className={FORM_CUSTOM_SELECT_ITEM_CLASS}
                          >
                            {choice}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "date" && (
                    <div className="relative">
                      <input
                        type="text"
                        required={field.required !== false}
                        value={formValues[field.id] || ""}
                        onChange={(e) =>
                          handleDateChange(field.id, e.target.value)
                        }
                        className={FORM_DATE_FIELD_CLASS}
                        placeholder="dd/mm/yyyy"
                        maxLength={10}
                        inputMode="numeric"
                      />
                      <input
                        ref={(element) => {
                          nativeDateInputRefs.current[field.id] = element;
                        }}
                        type="date"
                        className="sr-only"
                        onChange={(e) =>
                          handleDateChange(
                            field.id,
                            toDisplayDate(e.target.value),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => openDatePicker(field.id)}
                        className={FORM_ICON_BUTTON_CLASS}
                        aria-label="Open calendar"
                      >
                        <CalendarDays className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {field.type !== "text" &&
                    field.type !== "number" &&
                    field.type !== "textarea" &&
                    field.type !== "rating" &&
                    field.type !== "file" &&
                    field.type !== "choice" &&
                    field.type !== "date" && (
                      <input
                        type="text"
                        required={field.required !== false}
                        value={formValues[field.id] || ""}
                        onChange={(e) =>
                          handleTextChange(field.id, e.target.value)
                        }
                        className={FORM_FIELD_CLASS}
                        placeholder="Enter your answer"
                      />
                    )}

                  {field.type === "number" && (
                    <input
                      type="number"
                      required={field.required !== false}
                      value={formValues[field.id] || ""}
                      onChange={(e) =>
                        handleTextChange(field.id, e.target.value)
                      }
                      className={`no-number-spinner ${FORM_FIELD_CLASS}`}
                      placeholder="Enter number"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      required={field.required !== false}
                      value={formValues[field.id] || ""}
                      onChange={(e) =>
                        handleTextChange(field.id, e.target.value)
                      }
                      className={`${FORM_FIELD_CLASS} min-h-32 resize-y`}
                      placeholder="Enter your answer"
                    />
                  )}

                  {field.type === "rating" && (
                    <div className="flex items-center gap-1 py-2">
                      {Array.from(
                        { length: field.ratingLevels || 5 },
                        (_, i) => {
                          const activeRating = parseInt(
                            ratingPreviewValues[field.id] ||
                              formValues[field.id] ||
                              "0",
                          );
                          const isActive = activeRating >= i + 1;

                          return (
                            <button
                              key={i}
                              type="button"
                              onMouseEnter={() =>
                                setRatingPreviewValues((prev) => ({
                                  ...prev,
                                  [field.id]: String(i + 1),
                                }))
                              }
                              onMouseLeave={() =>
                                setRatingPreviewValues((prev) => {
                                  const next = { ...prev };
                                  delete next[field.id];
                                  return next;
                                })
                              }
                              onClick={() =>
                                handleTextChange(field.id, String(i + 1))
                              }
                              className={`rounded-sm p-1 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                isActive
                                  ? "text-blue-600"
                                  : "text-slate-200 hover:text-blue-500"
                              }`}
                              aria-label={`Rate ${i + 1} out of ${field.ratingLevels || 5}`}
                            >
                              <Star className="h-8 w-8 fill-current" />
                            </button>
                          );
                        },
                      )}
                      {formValues[field.id] && (
                        <span className="ml-2 font-data text-[12px] font-medium leading-4 text-[#424845]">
                          {formValues[field.id]}/{field.ratingLevels || 5}
                        </span>
                      )}
                    </div>
                  )}

                  {field.type === "file" && (
                    <div className="space-y-4">
                      <label
                        htmlFor={`file-${field.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
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
                        accept={fileAcceptTypes}
                        required={field.required !== false}
                        onChange={(e) =>
                          handleFileChange(field.id, e.target.files)
                        }
                        className="sr-only"
                      />

                      <div className="flex flex-wrap gap-x-4 gap-y-1 font-data text-[12px] font-medium leading-4 text-[#727974]">
                        <span>File number limit: 10</span>
                        <span>Single file size limit: 1GB</span>
                        <span>
                          Allowed file types: Word, Excel, PPT, PDF, Image,
                          Video, Audio
                        </span>
                      </div>

                      {uploadingFiles[field.id] && (
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <div className="flex items-center gap-2 min-w-0">
                              <Upload className="h-4 w-4 text-slate-400" />
                              <span className="truncate">
                                {(pendingFiles[field.id] || [])[0]?.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => clearUploadedFiles(field.id)}
                              className={FORM_SECONDARY_ACTION_CLASS}
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-blue-600 transition-all duration-200"
                              style={{
                                width: `${Math.max(
                                  5,
                                  Math.round(uploadProgress[field.id] || 0),
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {!uploadingFiles[field.id] &&
                        (fileValues[field.id] || []).length > 0 && (
                          <div className="space-y-2">
                            {(fileValues[field.id] || []).map(
                              (file, fileIndex) => (
                                <div
                                  key={`${field.id}-${file.name}-${fileIndex}`}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-ui text-[14px] leading-5 text-[#191c1d]"
                                >
                                  <span className="truncate">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeUploadedFile(field.id, fileIndex)
                                    }
                                    className="inline-flex items-center gap-1 font-ui text-[14px] font-medium leading-5 text-[#727974] transition-colors duration-200 hover:text-[#ba1a1a] cursor-pointer"
                                    aria-label={`Delete ${file.name}`}
                                  >
                                    <X className="h-4 w-4" /> Delete
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))
            )}

            {!isPreviewMode && (
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="submit"
                  disabled={fields.length === 0 || isSubmitting}
                  className={FORM_PRIMARY_BUTTON_CLASS}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            )}
          </div>
        </form>

        {showSubmitPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
              <h3 className="mb-2 text-xl font-semibold text-slate-800">
                Report submitted successfully
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Redirecting to dashboard...
              </p>
              <button
                type="button"
                onClick={handleGoToDashboard}
                className={`${FORM_PRIMARY_BUTTON_CLASS} w-full py-2.5`}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
