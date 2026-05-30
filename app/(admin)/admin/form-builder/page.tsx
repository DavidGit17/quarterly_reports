"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  COORDINATOR_PROJECT_OPTIONS,
  getBaseDefaultFields,
  getCustomFieldsFromConfigs,
  getDefaultQuarterConfigs,
  getHydratedFormState,
  MONTH_OPTIONS,
  saveDefaultFields,
  saveProjectQuarters,
  saveFormConfigs,
  pushFormConfigsToApi,
  pushDefaultFieldsToApi,
  pushQuarterConfigsToApi,
  toProjectSlug,
  type DynamicFieldType,
  type FormFieldConfig,
  type ProjectQuarterConfigs,
  type MonthOption,
  type ProjectFormConfigs,
} from "@/lib/shared/form-storage";
import {
  Plus,
  Trash2,
  Type,
  FileText,
  Calendar,
  Copy,
  FileUp,
  Heading2,
  ListChecks,
  Star,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  ArrowLeftCircle,
  ArrowDownToLine,
  ArrowUpToLine,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fieldTypeOptions: DynamicFieldType[] = [
  "text",
  "textarea",
  "number",
  "file",
  "choice",
  "rating",
  "date",
];
const EMPTY_FIELDS: FormFieldConfig[] = [];

const fieldTypeConfig: Record<
  DynamicFieldType,
  { label: string; icon: React.ReactNode; description: string }
> = {
  text: {
    label: "Text",
    icon: <Type className="w-5 h-5 text-slate-600" />,
    description: "Single line text input",
  },
  textarea: {
    label: "Paragraph",
    icon: <Heading2 className="w-5 h-5 text-slate-600" />,
    description: "Long text response",
  },
  number: {
    label: "Number",
    icon: <FileText className="w-5 h-5 text-slate-600" />,
    description: "Numeric input",
  },
  file: {
    label: "File",
    icon: <FileUp className="w-5 h-5 text-slate-600" />,
    description: "File upload",
  },
  choice: {
    label: "Choice",
    icon: <ListChecks className="w-5 h-5 text-slate-600" />,
    description: "Multiple choice options",
  },
  rating: {
    label: "Rating",
    icon: <Star className="w-5 h-5 text-slate-600" />,
    description: "Rating scale",
  },
  date: {
    label: "Date",
    icon: <Calendar className="w-5 h-5 text-slate-600" />,
    description: "Date picker",
  },
};

export default function AdminFormBuilderPage() {
  const router = useRouter();
  const [defaultFields, setDefaultFields] = useState<FormFieldConfig[]>([]);
  const [configs, setConfigs] = useState<ProjectFormConfigs>({});
  const [quarterConfigs, setQuarterConfigs] = useState<ProjectQuarterConfigs>(
    {},
  );
  const [selectedProject, setSelectedProject] = useState("Libya");
  const [newProjectName, setNewProjectName] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [origin, setOrigin] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeFieldMode, setActiveFieldMode] = useState<"default" | "custom">(
    "custom",
  );
  const [isProjectScopedEdit, setIsProjectScopedEdit] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<{
    id: string;
    scope: "default" | "custom";
  } | null>(null);
  const [defaultLabelDrafts, setDefaultLabelDrafts] = useState<
    Record<string, string>
  >({});
  const [customLabelDrafts, setCustomLabelDrafts] = useState<
    Record<string, string>
  >({});
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const initialDefaultFieldsRef = useRef<FormFieldConfig[]>([]);
  const [pendingAddedFieldId, setPendingAddedFieldId] = useState<string | null>(
    null,
  );
  const [recentlyAddedFieldId, setRecentlyAddedFieldId] = useState<
    string | null
  >(null);
  const [scrollPosition, setScrollPosition] = useState({
    canScrollDown: false,
    canScrollUp: false,
  });

  const projectOptions = useMemo(() => {
    const options = new Set<string>(COORDINATOR_PROJECT_OPTIONS);
    Object.keys(configs).forEach((project) => options.add(project));
    return Array.from(options);
  }, [configs]);

  const selectedFields: FormFieldConfig[] =
    configs[selectedProject] || EMPTY_FIELDS;
  const activeFieldCount =
    activeFieldMode === "default"
      ? defaultFields.length
      : selectedFields.length;
  const activeFieldLabel =
    activeFieldMode === "default" ? "default field" : "custom field";

  useEffect(() => {
    const loadFormState = async () => {
      const {
        defaultFields: hydratedDefaults,
        customConfigs,
        quarterConfigs,
      } = await getHydratedFormState();

      // Ensure we have all 27 default fields
      const defaultsToUse =
        hydratedDefaults.length >= 27
          ? hydratedDefaults
          : getBaseDefaultFields();

      initialDefaultFieldsRef.current = defaultsToUse;
      setDefaultFields(defaultsToUse);
      setConfigs(customConfigs);
      setQuarterConfigs(quarterConfigs);

      const params = new URLSearchParams(window.location.search);
      const projectParam = params.get("project");

      if (projectParam) {
        setIsProjectScopedEdit(true);
        setActiveFieldMode("custom");
        setSelectedProject(projectParam);
      } else {
        setIsProjectScopedEdit(false);
        const projectKeys = Object.keys(customConfigs);
        if (projectKeys.length > 0) {
          setSelectedProject(projectKeys[0]);
        } else if (COORDINATOR_PROJECT_OPTIONS.length > 0) {
          setSelectedProject(COORDINATOR_PROJECT_OPTIONS[0]);
        }
      }
    };

    void loadFormState();
  }, []);

  useEffect(() => {
    setDefaultLabelDrafts((prev) => {
      const next = { ...prev };
      for (const field of defaultFields) {
        next[field.id] = field.label;
      }
      return next;
    });
  }, [defaultFields]);

  useEffect(() => {
    setCustomLabelDrafts((prev) => {
      const next = { ...prev };
      for (const field of selectedFields) {
        next[field.id] = field.label;
      }
      return next;
    });
  }, [selectedFields]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const updateScrollPosition = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = documentHeight - (scrollTop + viewportHeight);

      setScrollPosition({
        canScrollDown: scrollTop > 80 && distanceFromBottom > 220,
        canScrollUp: scrollTop > 420,
      });
    };

    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    window.addEventListener("resize", updateScrollPosition);

    return () => {
      window.removeEventListener("scroll", updateScrollPosition);
      window.removeEventListener("resize", updateScrollPosition);
    };
  }, []);

  useEffect(() => {
    if (!pendingAddedFieldId) {
      return;
    }

    const fieldElement = fieldRefs.current[pendingAddedFieldId];
    if (!fieldElement) {
      return;
    }

    fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
    fieldElement.querySelector<HTMLInputElement>("input[type='text']")?.focus({
      preventScroll: true,
    });
    setRecentlyAddedFieldId(pendingAddedFieldId);
    setPendingAddedFieldId(null);
  }, [defaultFields, pendingAddedFieldId, selectedFields]);

  useEffect(() => {
    if (!recentlyAddedFieldId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyAddedFieldId(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyAddedFieldId]);

  const getProjectFormLink = () => {
    if (!origin) {
      return "";
    }

    return `${origin}/form/${toProjectSlug(selectedProject)}`;
  };

  const handleCopyFormLink = async () => {
    const formLink = getProjectFormLink();

    if (!formLink) {
      setCopyMessage("Unable to copy link");
      return;
    }

    try {
      await navigator.clipboard.writeText(formLink);
      setCopyMessage("Link copied");
    } catch {
      setCopyMessage("Unable to copy link");
    }
  };

  const projectFormLink = getProjectFormLink();
  const whatsappShareLink = projectFormLink
    ? `https://wa.me/?text=${encodeURIComponent(projectFormLink)}`
    : "";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  const updateDefaultField = (
    fieldId: string,
    updates: Partial<FormFieldConfig>,
  ) => {
    setDefaultFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              ...updates,
            }
          : field,
      ),
    );
  };

  const updateField = (fieldId: string, updates: Partial<FormFieldConfig>) => {
    setConfigs((prev) => {
      const updatedProjectFields = (prev[selectedProject] || []).map(
        (field) => {
          if (field.id !== fieldId) {
            return field;
          }

          return {
            ...field,
            ...updates,
          };
        },
      );

      return {
        ...prev,
        [selectedProject]: updatedProjectFields,
      };
    });
  };

  const addDefaultField = () => {
    const newFieldId = `default-field-${Math.random().toString(36).substr(2, 9)}`;

    setDefaultFields((prev) => {
      const newField: FormFieldConfig = {
        id: newFieldId,
        label: "",
        type: "text",
        required: true,
      };

      return [...prev, newField];
    });
    setPendingAddedFieldId(newFieldId);
  };

  const addNewField = () => {
    const newFieldId = `new-field-${Math.random().toString(36).substr(2, 9)}`;

    setConfigs((prev) => {
      const currentProjectFields = prev[selectedProject] || [];

      const newField: FormFieldConfig = {
        id: newFieldId,
        label: "",
        type: "text",
        required: true,
      };

      return {
        ...prev,
        [selectedProject]: [...currentProjectFields, newField],
      };
    });
    setPendingAddedFieldId(newFieldId);
  };

  const removeDefaultField = (fieldId: string) => {
    setDefaultFields((prev) => prev.filter((field) => field.id !== fieldId));
  };

  const resetAllProjectsToDefaults = () => {
    // Remove ALL custom fields from ALL projects - reset every project to only 27 default fields
    setConfigs({}); // Clear all custom fields across all projects
    const baseDefaults = getBaseDefaultFields();
    setDefaultFields(baseDefaults); // Reset default fields to the original 27
    alert(
      "All projects reset to only 27 default fields! All custom fields (28, 29, 30, etc.) removed.",
    );
  };

  const removeField = (fieldId: string) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedProject]: (prev[selectedProject] || []).filter(
        (field) => field.id !== fieldId,
      ),
    }));
  };

  const addProject = () => {
    const trimmedProjectName = newProjectName.trim();
    if (!trimmedProjectName) {
      return;
    }

    setConfigs((prev) => {
      if (prev[trimmedProjectName]) {
        return prev;
      }

      return {
        ...prev,
        [trimmedProjectName]: [],
      };
    });

    setQuarterConfigs((prev) => ({
      ...prev,
      [trimmedProjectName]: prev[trimmedProjectName] ||
        (prev[selectedProject] ?? undefined) || {
          startMonth: "January",
          endMonth: "March",
        },
    }));

    setSelectedProject(trimmedProjectName);
    setNewProjectName("");
  };

  const handleSave = async () => {
    const defaultsToSave = isProjectScopedEdit
      ? initialDefaultFieldsRef.current
      : defaultFields;
    const customConfigsToSave = getCustomFieldsFromConfigs(
      configs,
      defaultsToSave,
    );

    saveDefaultFields(defaultsToSave);
    saveFormConfigs(customConfigsToSave);
    saveProjectQuarters(quarterConfigs);
    await Promise.all([
      pushDefaultFieldsToApi(defaultsToSave),
      pushFormConfigsToApi(customConfigsToSave),
      pushQuarterConfigsToApi(quarterConfigs),
    ]);
    router.push("/dashboard");
  };

  const resetDefaults = async () => {
    const defaultFields = getBaseDefaultFields();
    const defaults: ProjectFormConfigs = {};
    const defaultQuarters = getDefaultQuarterConfigs();
    setDefaultFields(defaultFields);
    setConfigs(defaults);
    setQuarterConfigs(defaultQuarters);
    setSelectedProject(COORDINATOR_PROJECT_OPTIONS[0] || "");
    saveDefaultFields(defaultFields);
    saveFormConfigs(defaults);
    saveProjectQuarters(defaultQuarters);
    await Promise.all([
      pushDefaultFieldsToApi(defaultFields),
      pushFormConfigsToApi(defaults),
      pushQuarterConfigsToApi(defaultQuarters),
    ]);
  };

  const moveFieldUp = (fieldId: string, scope: "default" | "custom") => {
    if (scope === "default") {
      setDefaultFields((prev) => {
        const index = prev.findIndex((f) => f.id === fieldId);
        if (index <= 0) return prev;
        const newFields = [...prev];
        [newFields[index - 1], newFields[index]] = [
          newFields[index],
          newFields[index - 1],
        ];
        return newFields;
      });
    } else {
      setConfigs((prev) => {
        const currentFields = prev[selectedProject] || [];
        const index = currentFields.findIndex((f) => f.id === fieldId);
        if (index <= 0) return prev;
        const newFields = [...currentFields];
        [newFields[index - 1], newFields[index]] = [
          newFields[index],
          newFields[index - 1],
        ];
        return {
          ...prev,
          [selectedProject]: newFields,
        };
      });
    }
  };

  const moveFieldDown = (fieldId: string, scope: "default" | "custom") => {
    if (scope === "default") {
      setDefaultFields((prev) => {
        const index = prev.findIndex((f) => f.id === fieldId);
        if (index >= prev.length - 1) return prev;
        const newFields = [...prev];
        [newFields[index], newFields[index + 1]] = [
          newFields[index + 1],
          newFields[index],
        ];
        return newFields;
      });
    } else {
      setConfigs((prev) => {
        const currentFields = prev[selectedProject] || [];
        const index = currentFields.findIndex((f) => f.id === fieldId);
        if (index >= currentFields.length - 1) return prev;
        const newFields = [...currentFields];
        [newFields[index], newFields[index + 1]] = [
          newFields[index + 1],
          newFields[index],
        ];
        return {
          ...prev,
          [selectedProject]: newFields,
        };
      });
    }
  };

  const copyField = (field: FormFieldConfig, scope: "default" | "custom") => {
    const newField: FormFieldConfig = {
      ...field,
      id: `${field.id}-copy-${Math.random().toString(36).substr(2, 9)}`,
      label: `${field.label} (copy)`,
    };

    if (scope === "default") {
      setDefaultFields((prev) => [...prev, newField]);
    } else {
      setConfigs((prev) => ({
        ...prev,
        [selectedProject]: [...(prev[selectedProject] || []), newField],
      }));
    }
  };

  const renderFieldOptions = (
    field: FormFieldConfig,
    updateFn: (id: string, updates: Partial<FormFieldConfig>) => void,
  ) => {
    if (field.type === "choice") {
      return (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-3">
            Options
          </label>
          <div className="space-y-2 mb-3">
            {(field.choices || ["Option 1", "Option 2"]).map((choice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-300 bg-white shrink-0"></div>
                <input
                  type="text"
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [
                      ...(field.choices || ["Option 1", "Option 2"]),
                    ];
                    newChoices[idx] = e.target.value;
                    updateFn(field.id, { choices: newChoices });
                  }}
                  disabled={choice === "Other"}
                  className={`flex-1 border border-slate-300 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004446] ${
                    choice === "Other"
                      ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                      : ""
                  }`}
                  placeholder={`Option ${idx + 1}`}
                />
                {(field.choices?.length || 2) > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newChoices =
                        field.choices?.filter((_, i) => i !== idx) || [];
                      updateFn(field.id, { choices: newChoices });
                    }}
                    className="text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const newChoices = [
                  ...(field.choices || ["Option 1", "Option 2"]),
                  `Option ${(field.choices?.length || 2) + 1}`,
                ];
                updateFn(field.id, { choices: newChoices });
              }}
              className="text-sm text-slate-700 hover:text-slate-800 font-medium flex items-center gap-1"
            >
              + Add option
            </button>
            <button
              type="button"
              onClick={() => {
                const newChoices = [
                  ...(field.choices || ["Option 1", "Option 2"]),
                  "Other",
                ];
                updateFn(field.id, { choices: newChoices });
              }}
              className="text-sm text-slate-700 hover:text-slate-800 font-medium"
            >
              Add "Other" option
            </button>
          </div>
        </div>
      );
    }

    if (field.type === "rating") {
      return (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Levels
              </label>
              <select
                value={field.ratingLevels || 5}
                onChange={(e) =>
                  updateFn(field.id, { ratingLevels: parseInt(e.target.value) })
                }
                className="w-full border border-slate-300 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004446]"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={7}>7</option>
                <option value={10}>10</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Symbol
              </label>
              <select
                value={field.ratingSymbol || "Star"}
                onChange={(e) =>
                  updateFn(field.id, { ratingSymbol: e.target.value })
                }
                className="w-full border border-slate-300 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004446]"
              >
                <option value="Star">★ Star</option>
                <option value="Heart">♥ Heart</option>
                <option value="Circle">● Circle</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (field.type === "date") {
      return (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date input with calendar picker
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 md:pt-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href="/dashboard"
                className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                aria-label="Back to dashboard"
              >
                <ArrowLeftCircle className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Form Builder
                </h1>
                <p className="text-slate-600 mt-1">
                  Customize coordinator default fields and project-specific
                  forms
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetDefaults}
              className="inline-flex items-center justify-center px-4 py-2 rounded-2xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>

        {/* Edit Mode Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <label className="block text-sm font-semibold text-slate-900 mb-4">
            Edit Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (!isProjectScopedEdit) {
                  setActiveFieldMode("default");
                }
              }}
              disabled={isProjectScopedEdit}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                activeFieldMode === "default"
                  ? "border-slate-700 bg-slate-100 text-slate-800"
                  : isProjectScopedEdit
                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="block font-semibold">
                Coordinator Default Fields
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFieldMode("custom")}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                activeFieldMode === "custom"
                  ? "border-slate-700 bg-slate-100 text-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="block font-semibold">Custom Field Labels</span>
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 space-y-6">
          {/* Share Form Link */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Share form link for{" "}
              <span className="text-slate-700">{selectedProject}</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleCopyFormLink}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-900 text-sm font-medium hover:bg-slate-200 transition-colors active:bg-slate-300"
              >
                Copy Form Link
              </button>
              <a
                href={whatsappShareLink || "#"}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!whatsappShareLink}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
                onClick={(event) => {
                  if (!whatsappShareLink) {
                    event.preventDefault();
                  }
                }}
              >
                Share via WhatsApp
              </a>
            </div>
            {copyMessage && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                {copyMessage}
              </p>
            )}
          </div>

          <div className="border-t border-slate-200"></div>

          {/* Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Select Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#004446] focus:border-[#004446] appearance-none bg-no-repeat bg-white"
                style={{
                  paddingRight: "2.5rem",
                  backgroundPosition: "right 1rem center",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                }}
              >
                {projectOptions.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Project */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Add New Project
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#004446] focus:border-[#004446]"
                  placeholder="Project name"
                />
                <button
                  type="button"
                  onClick={addProject}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200"></div>

          {/* Quarter Configuration */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Set Quarter Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Start Month
                </label>
                <select
                  value={
                    quarterConfigs[selectedProject]?.startMonth || "January"
                  }
                  onChange={(e) =>
                    setQuarterConfigs((prev) => ({
                      ...prev,
                      [selectedProject]: {
                        startMonth: e.target.value as MonthOption,
                        endMonth: prev[selectedProject]?.endMonth || "March",
                      },
                    }))
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#004446] focus:border-[#004446] appearance-none bg-no-repeat bg-white"
                  style={{
                    paddingRight: "2.5rem",
                    backgroundPosition: "right 1rem center",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  }}
                >
                  {MONTH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  End Month
                </label>
                <select
                  value={quarterConfigs[selectedProject]?.endMonth || "March"}
                  onChange={(e) =>
                    setQuarterConfigs((prev) => ({
                      ...prev,
                      [selectedProject]: {
                        startMonth:
                          prev[selectedProject]?.startMonth || "January",
                        endMonth: e.target.value as MonthOption,
                      },
                    }))
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#004446] focus:border-[#004446] appearance-none bg-no-repeat bg-white"
                  style={{
                    paddingRight: "2.5rem",
                    backgroundPosition: "right 1rem center",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  }}
                >
                  {MONTH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Fields Section */}
        <div className="space-y-8">
          {activeFieldMode === "default" ? (
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Default Form Fields
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    {defaultFields.length} fields shared across all projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addDefaultField}
                  className="md:hidden inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </button>
              </div>

              <div className="grid gap-4">
                {defaultFields.map((field, index) => (
                  <div
                    key={`default-${field.id}`}
                    ref={(element) => {
                      fieldRefs.current[field.id] = element;
                    }}
                    className={`bg-white rounded-2xl border p-5 transition-colors ${
                      recentlyAddedFieldId === field.id
                        ? "border-slate-700 bg-slate-50 ring-2 ring-slate-200"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyField(field, "default")}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Copy field"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFieldUp(field.id, "default")}
                          disabled={index === 0}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs transition-colors ${
                            index === 0
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-500 hover:text-green-600 hover:bg-green-50"
                          }`}
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFieldDown(field.id, "default")}
                          disabled={index === defaultFields.length - 1}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs transition-colors ${
                            index === defaultFields.length - 1
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-500 hover:text-green-600 hover:bg-green-50"
                          }`}
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFieldToDelete({
                              id: field.id,
                              scope: "default",
                            });
                            setDeleteDialogOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Label
                        </label>
                        <input
                          type="text"
                          value={defaultLabelDrafts[field.id] ?? ""}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setDefaultLabelDrafts((prev) => ({
                              ...prev,
                              [field.id]: nextValue,
                            }));
                            updateDefaultField(field.id, { label: nextValue });
                          }}
                          className="w-full border border-slate-300 rounded-2xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#004446] focus:border-[#004446]"
                          placeholder={field.label || "Enter label name..."}
                        />
                      </div>
                      <div>{renderFieldOptions(field, updateDefaultField)}</div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-3">
                          Field Type
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {fieldTypeOptions.map((typeOption) => (
                            <label
                              key={typeOption}
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                field.type === typeOption
                                  ? "border-slate-700 bg-slate-100"
                                  : "border-slate-300 bg-white hover:border-slate-400"
                              }`}
                            >
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name={`field-type-${field.id}`}
                                  value={typeOption}
                                  checked={field.type === typeOption}
                                  onChange={() =>
                                    updateDefaultField(field.id, {
                                      type: typeOption,
                                    })
                                  }
                                  className="w-5 h-5 text-slate-700 cursor-pointer"
                                />
                              </div>
                              <div className="flex items-center gap-3 flex-1">
                                {fieldTypeConfig[typeOption]?.icon}
                                <span className="font-medium text-slate-700">
                                  {fieldTypeConfig[typeOption]?.label}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-end gap-6">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">
                              {field.type === "textarea"
                                ? "Long answer"
                                : "Required"}
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                updateDefaultField(field.id, {
                                  required: !field.required,
                                })
                              }
                              className={`relative inline-flex w-12 h-7 rounded-full transition-colors ${
                                field.required ? "bg-slate-700" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`inline-block w-5 h-5 rounded-full bg-white transition-transform ${
                                  field.required
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                } my-auto`}
                              />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Custom Fields
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Add custom fields to extend the {selectedProject} form.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addNewField}
                  className="md:hidden inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </button>
              </div>

              <div className="grid gap-4">
                {selectedFields.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-600 text-sm">
                      No custom fields yet. Add custom fields to extend the
                      form.
                    </p>
                  </div>
                ) : (
                  selectedFields.map((field, index) => (
                    <div
                      key={field.id}
                      ref={(element) => {
                        fieldRefs.current[field.id] = element;
                      }}
                      className={`bg-white rounded-2xl border p-5 transition-colors ${
                        recentlyAddedFieldId === field.id
                          ? "border-slate-700 bg-slate-50 ring-2 ring-slate-200"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="inline-flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyField(field, "custom")}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy field"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFieldUp(field.id, "custom")}
                            disabled={index === 0}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs transition-colors ${
                              index === 0
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFieldDown(field.id, "custom")}
                            disabled={index === selectedFields.length - 1}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs transition-colors ${
                              index === selectedFields.length - 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFieldToDelete({
                                id: field.id,
                                scope: "custom",
                              });
                              setDeleteDialogOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Label
                          </label>
                          <input
                            type="text"
                            value={customLabelDrafts[field.id] ?? ""}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              setCustomLabelDrafts((prev) => ({
                                ...prev,
                                [field.id]: nextValue,
                              }));
                              updateField(field.id, { label: nextValue });
                            }}
                            className="w-full border border-slate-300 rounded-2xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#004446] focus:border-[#004446]"
                            placeholder={field.label || "Enter label name..."}
                          />
                        </div>
                        <div>{renderFieldOptions(field, updateField)}</div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-3">
                            Field Type
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {fieldTypeOptions.map((typeOption) => (
                              <label
                                key={typeOption}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                  field.type === typeOption
                                    ? "border-slate-700 bg-slate-100"
                                    : "border-slate-300 bg-white hover:border-slate-400"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`field-type-${field.id}`}
                                  value={typeOption}
                                  checked={field.type === typeOption}
                                  onChange={() =>
                                    updateField(field.id, {
                                      type: typeOption,
                                    })
                                  }
                                  className="w-5 h-5 text-slate-700 cursor-pointer"
                                />
                                <div className="flex items-center gap-3 flex-1">
                                  {fieldTypeConfig[typeOption]?.icon}
                                  <span className="font-medium text-slate-700">
                                    {fieldTypeConfig[typeOption]?.label ||
                                      typeOption}
                                  </span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-slate-200 pt-4">
                          <div className="flex items-center justify-end gap-6">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-slate-700">
                                {field.type === "textarea"
                                  ? "Long answer"
                                  : "Required"}
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  updateField(field.id, {
                                    required: !field.required,
                                  })
                                }
                                className={`relative inline-flex w-12 h-7 rounded-full transition-colors ${
                                  field.required
                                    ? "bg-slate-700"
                                    : "bg-slate-300"
                                }`}
                              >
                                <span
                                  className={`inline-block w-5 h-5 rounded-full bg-white transition-transform ${
                                    field.required
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  } my-auto`}
                                />
                              </button>
                            </div>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={resetAllProjectsToDefaults}
            className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Reset All Projects
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Save Form Structure
          </button>
        </div>

        {/* Sticky Add Field Button */}
        {(activeFieldMode === "default" || activeFieldMode === "custom") && (
          <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2 md:right-8">
            <div className="hidden md:flex flex-col gap-2">
              {scrollPosition.canScrollUp && (
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Scroll to top"
                  title="Scroll to top"
                >
                  <ArrowUpToLine className="h-4 w-4" />
                </button>
              )}
              {scrollPosition.canScrollDown && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Scroll to bottom"
                  title="Scroll to bottom"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={
                activeFieldMode === "default" ? addDefaultField : addNewField
              }
              className="hidden md:inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:bg-slate-900"
              title={`Add a new ${activeFieldLabel}. ${activeFieldCount} ${activeFieldCount === 1 ? "field" : "fields"} currently.`}
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this field? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!fieldToDelete) {
                    return;
                  }

                  if (fieldToDelete.scope === "default") {
                    removeDefaultField(fieldToDelete.id);
                  } else {
                    removeField(fieldToDelete.id);
                  }

                  setFieldToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
