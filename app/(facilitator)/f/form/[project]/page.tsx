"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  CircleUserRound,
  Eye,
  Star,
  Upload,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
const FORM_BACKGROUND =
  "linear-gradient(135deg, #f0f4f2 0%, #f8f9fa 50%, #f5f7f6 100%)";
const FORM_FIELD_CLASS =
  "w-full rounded border border-[#727974] bg-[#ffffff] px-4 py-3 font-ui text-[16px] leading-6 text-[#191c1d] placeholder:text-[#727974] transition-[border-color,box-shadow,background-color] duration-200 hover:border-[#344b41] focus:border-[#4b6358] focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#b2cdbf]/60 disabled:border-[#d9dadb] disabled:bg-[#edeeef] disabled:text-[#727974] disabled:cursor-not-allowed";
const FORM_DATE_FIELD_CLASS = `${FORM_FIELD_CLASS} pr-12`;
const FORM_CUSTOM_SELECT_TRIGGER_CLASS =
  "h-auto w-full rounded border-[#727974] bg-[#ffffff] px-4 py-3 font-ui text-[16px] leading-6 text-[#191c1d] shadow-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[#344b41] focus:border-[#4b6358] focus:ring-2 focus:ring-[#b2cdbf]/60 focus-visible:border-[#4b6358] focus-visible:ring-2 focus-visible:ring-[#b2cdbf]/60 data-[placeholder]:text-[#727974]";
const FORM_CUSTOM_SELECT_CONTENT_CLASS =
  "rounded border-[#c2c8c3] bg-[#ffffff] text-[#191c1d] shadow-[0_4px_12px_rgba(90,100,114,0.08)]";
const FORM_CUSTOM_SELECT_ITEM_CLASS =
  "cursor-pointer rounded-sm py-2 pl-8 pr-3 font-ui text-[14px] leading-5 text-[#191c1d] transition-colors duration-150 focus:bg-[#cee9db] focus:text-[#082017] data-[state=checked]:bg-[#4b6358] data-[state=checked]:text-white";
const FORM_SURFACE_CLASS = "rounded-lg border border-[#c2c8c3] bg-[#ffffff]";
const FORM_LABEL_CLASS =
  "block font-ui text-[16px] font-medium leading-6 text-[#191c1d]";
const FORM_REQUIRED_CLASS = "font-ui font-semibold text-[#ba1a1a]";
const FORM_META_CLASS =
  "font-ui text-[14px] leading-5 text-[#424845]";
const FORM_LINK_CLASS =
  "font-ui text-[14px] font-medium text-[#555f6d] transition-colors duration-200 hover:text-[#344b41]";
const FORM_ICON_BUTTON_CLASS =
  "absolute right-3 top-1/2 -translate-y-1/2 text-[#555f6d] transition-colors duration-200 hover:text-[#344b41] cursor-pointer";
const FORM_SECONDARY_ACTION_CLASS =
  "font-ui text-[14px] font-medium text-[#555f6d] transition-colors duration-200 hover:text-[#344b41] cursor-pointer";
const FORM_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded bg-[#4b6358] px-8 py-3 font-ui text-[16px] font-semibold leading-6 text-white transition-[background-color,box-shadow] duration-200 hover:bg-[#344b41] focus:outline-none focus:ring-2 focus:ring-[#b2cdbf]/70 active:bg-[#344b41] cursor-pointer disabled:bg-[#d9dadb] disabled:text-[#727974] disabled:cursor-not-allowed";

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

const getUserInitials = (username: string) => {
  const parts = username.trim().split(/\s+/);

  if (parts.length === 0 || !parts[0]) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

export default function FacilitatorProjectFormPage() {
  const router = useRouter();
  const params = useParams<{ project: string }>();
  const projectSlug = (params?.project || "").toString().toLowerCase();

  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [quarter, setQuarter] = useState("");
  const [projectName, setProjectName] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("Facilitator");
  const [profileImagePreview, setProfileImagePreview] = useState("");
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
  const [cycleError, setCycleError] = useState("");
  const [activeCycleId, setActiveCycleId] = useState("");

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

          setProfileImagePreview(data.user.profileImage || "");

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
          } else {
            setCycleError(
              "No active reporting period for this project.",
            );
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
        router.push("/f/my-reports");
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
    router.push("/f/my-reports");
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
      <div className="coordinator-system min-h-screen" style={{ background: FORM_BACKGROUND }}>
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

  if (cycleError) {
    return (
      <div className="coordinator-system min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4">
        <div className={`${FORM_SURFACE_CLASS} p-8 w-full max-w-md text-center`}>
          <h1 className="mb-3 font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d]">
            No Active Reporting Period
          </h1>
          <p className={`${FORM_META_CLASS} mb-5`}>
            {cycleError}
          </p>
          <Link
            href="/f/my-reports"
            className={FORM_LINK_CLASS}
          >
            My Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="coordinator-system min-h-screen"
      style={{ background: FORM_BACKGROUND }}
    >
      <div className="max-w-4xl mx-auto px-4 py-10">
        {isPreviewMode && (
          <div className="mb-6 rounded-lg border border-[#d6c3b1] bg-[#f3dfcc] px-6 py-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-[#514436] shrink-0" />
            <div>
              <p className="font-ui text-[14px] font-semibold leading-5 text-[#241a0e]">
                Preview Mode
              </p>
              <p className="font-data text-[12px] font-medium leading-4 text-[#524437]">
                You are viewing this form as an admin. This is a read-only
                preview.
              </p>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-10 mb-6 -mx-4 px-4 bg-[#f8f9fa] pt-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d] md:text-[30px] md:leading-10 md:tracking-[-0.02em]">
              {isPreviewMode ? "Form Preview" : "Quarterly Report Submission"}
            </h1>
            <div className="flex items-center gap-4">
              {!isPreviewMode && (
                <Link
                  href="/f/my-reports"
                  className={FORM_LINK_CLASS}
                >
                  My Reports
                </Link>
              )}
              {!isPreviewMode && (
                <Link
                  href="/profile"
                  className="inline-flex items-center text-[#555f6d] transition-colors duration-200 hover:text-[#344b41]"
                  aria-label="Go to profile"
                  title="Profile"
                >
                  <Avatar className="h-9 w-9 border border-[#c2c8c3]">
                    {profileImagePreview ? (
                      <AvatarImage src={profileImagePreview} alt="Profile" />
                    ) : null}
                    <AvatarFallback className="bg-[#e1e3e4] font-data text-[12px] font-medium text-[#344b41]">
                      {coordinatorName ? (
                        getUserInitials(coordinatorName)
                      ) : (
                        <CircleUserRound className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className={`${FORM_SURFACE_CLASS} p-8 mb-6`}>
          <h2 className="mb-4 font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d] sm:text-[30px] sm:leading-10 sm:tracking-[-0.02em]">
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="rounded border border-[#c2c8c3] bg-[#f3f4f5] px-4 py-3 font-ui text-[16px] font-medium leading-6 text-[#191c1d]">
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
                              className={`rounded-sm p-1 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#b2cdbf]/60 ${
                                isActive
                                  ? "text-[#4b6358]"
                                  : "text-[#c2c8c3] hover:text-[#4b6358]"
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
                        className="inline-flex items-center gap-2 rounded border border-[#c2c8c3] bg-[#ffffff] px-3 py-2 font-ui text-[14px] font-medium leading-5 text-[#344b41] transition-[background-color,border-color] duration-200 hover:border-[#4b6358] hover:bg-[#cee9db]/35 cursor-pointer"
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
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded border border-dashed border-[#c2c8c3] bg-[#f3f4f5] px-3 py-2 font-ui text-[14px] leading-5 text-[#191c1d]">
                            <div className="flex items-center gap-2 min-w-0">
                              <Upload className="h-4 w-4 text-[#555f6d]" />
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
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e1e3e4]">
                            <div
                              className="h-full bg-[#4b6358] transition-all duration-200"
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
            <div className="w-full max-w-md rounded-lg border border-[#c2c8c3] bg-[#ffffff] p-6 shadow-[0_4px_12px_rgba(90,100,114,0.08)]">
              <h3 className="mb-2 font-heading text-[20px] font-medium leading-7 text-[#191c1d]">
                Report submitted successfully
              </h3>
              <p className={`${FORM_META_CLASS} mb-5`}>
                Redirecting to submitted reports history...
              </p>
              <button
                type="button"
                onClick={handleGoToHistory}
                className={`${FORM_PRIMARY_BUTTON_CLASS} w-full py-2.5`}
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
