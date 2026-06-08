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
  saveFormTitles,
  saveFormMeta,
  setFormBaseline,
  getFormBaselines,
  pushFormConfigsToApi,
  pushDefaultFieldsToApi,
  pushQuarterConfigsToApi,
  pushFormTitlesToApi,
  pushFormMetaToApi,
  toProjectSlug,
  type DynamicFieldType,
  type FormFieldConfig,
  type ProjectQuarterConfigs,
  type FormTitles,
  type FormMeta,
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
  ArrowLeft,
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
  const lastScrollYRef = useRef(0);
  const [pendingAddedFieldId, setPendingAddedFieldId] = useState<string | null>(
    null,
  );
  const [recentlyAddedFieldId, setRecentlyAddedFieldId] = useState<
    string | null
  >(null);
  const [formTitles, setFormTitles] = useState<FormTitles>({});
  const [createFormTitle, setCreateFormTitle] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);

  const markDirty = () => {
    isDirtyRef.current = true;
    setIsDirty(true);
  };

  const [scrollPosition, setScrollPosition] = useState({
    canScrollDown: false,
    canScrollUp: false,
  });

  const selectedFields: FormFieldConfig[] =
    configs[selectedProject] || EMPTY_FIELDS;
  const predefinedProjects: Set<string> = useMemo(
    () => new Set(COORDINATOR_PROJECT_OPTIONS),
    [],
  );
  const scopedProjectFields = useMemo(() => {
    if (!isProjectScopedEdit) return [];
    if (predefinedProjects.has(selectedProject)) {
      const customIds = new Set(selectedFields.map((field) => field.id));
      const filteredDefaults = defaultFields.filter(
        (field) => !customIds.has(field.id),
      );
      return [...filteredDefaults, ...selectedFields];
    }
    return [...selectedFields];
  }, [isProjectScopedEdit, defaultFields, selectedFields, predefinedProjects, selectedProject]);
  useEffect(() => {
    const loadFormState = async () => {
      const {
        defaultFields: hydratedDefaults,
        customConfigs,
        quarterConfigs,
        formTitles: hydratedTitles,
        formMeta: hydratedMeta,
      } = await getHydratedFormState();

      // Ensure we have all 27 default fields (hydratedDefaults can have MORE than 27 - custom fields added via builder)
      const defaultsToUse =
        hydratedDefaults.length >= 27
          ? hydratedDefaults
          : getBaseDefaultFields();

      initialDefaultFieldsRef.current = defaultsToUse;
      setDefaultFields(defaultsToUse);
      setConfigs(customConfigs);
      setQuarterConfigs(quarterConfigs);
      setFormTitles(hydratedTitles);
      setLastSavedAt(hydratedMeta.lastSavedAt);

      const params = new URLSearchParams(window.location.search);
      const projectParam = params.get("project");

      if (projectParam) {
        setIsProjectScopedEdit(true);
        setSelectedProject(projectParam);
      } else {
        setIsProjectScopedEdit(false);
        setSelectedProject("");
      }
    };

    void loadFormState().then(() => setHydrating(false));
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
      const isScrollingDown = scrollTop > lastScrollYRef.current;
      const isScrollingUp = scrollTop < lastScrollYRef.current;
      const isNearBottom = distanceFromBottom <= 220;

      setScrollPosition({
        canScrollDown: scrollTop > 80 && isScrollingDown && !isNearBottom,
        canScrollUp: scrollTop > 420 && (isScrollingUp || isNearBottom),
      });
      lastScrollYRef.current = scrollTop;
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
    markDirty();
  };

  const updateField = (fieldId: string, updates: Partial<FormFieldConfig>) => {
    setConfigs((prev) => {
      const currentFields = prev[selectedProject] || [];
      const existingIndex = currentFields.findIndex(
        (f) => f.id === fieldId,
      );

      if (existingIndex >= 0) {
        const updatedProjectFields = currentFields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field,
        );
        return {
          ...prev,
          [selectedProject]: updatedProjectFields,
        };
      }

      // Field not yet in configs — create an override from the default
      const defaultField = defaultFields.find((f) => f.id === fieldId);
      if (defaultField) {
        return {
          ...prev,
          [selectedProject]: [
            ...currentFields,
            { ...defaultField, ...updates },
          ],
        };
      }

      return prev;
    });
    markDirty();
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
    markDirty();
  };

  const removeDefaultField = (fieldId: string) => {
    setDefaultFields((prev) => prev.filter((field) => field.id !== fieldId));
    markDirty();
  };

  const removeField = (fieldId: string) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedProject]: (prev[selectedProject] || []).filter(
        (field) => field.id !== fieldId,
      ),
    }));
    markDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    const defaultsToSave = isProjectScopedEdit
      ? initialDefaultFieldsRef.current
      : defaultFields;
    const customConfigsToSave = getCustomFieldsFromConfigs(
      configs,
      defaultsToSave,
    );
    const now = new Date().toISOString();
    const meta: FormMeta = { lastSavedAt: now };

    const titlesToSave: FormTitles = isProjectScopedEdit
      ? formTitles
      : { ...formTitles, [selectedProject]: createFormTitle };

    saveDefaultFields(defaultsToSave);
    saveFormConfigs(customConfigsToSave);
    if (!isProjectScopedEdit) {
      const projectFields = customConfigsToSave[selectedProject] || [];
      setFormBaseline(selectedProject, projectFields);
    }
    saveProjectQuarters(quarterConfigs);
    saveFormTitles(titlesToSave);
    saveFormMeta(meta);
    await Promise.all([
      pushDefaultFieldsToApi(defaultsToSave),
      pushFormConfigsToApi(customConfigsToSave),
      pushQuarterConfigsToApi(quarterConfigs),
      pushFormTitlesToApi(titlesToSave),
      pushFormMetaToApi(meta),
    ]);
    setLastSavedAt(now);
    isDirtyRef.current = false;
    setIsDirty(false);
    setSaving(false);
    window.location.href = "/dashboard/forms-overview";
  };



  const resetDefaults = async () => {
    const predefined = new Set(COORDINATOR_PROJECT_OPTIONS as unknown as string[]);

    if (predefined.has(selectedProject)) {
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
    } else {
      const baselines = getFormBaselines();
      const baselineFields = baselines[selectedProject] || [];
      const updatedConfigs = {
        ...configs,
        [selectedProject]: [...baselineFields],
      };
      setConfigs((prev) => ({
        ...prev,
        [selectedProject]: [...baselineFields],
      }));
      saveFormConfigs(updatedConfigs);
      await pushFormConfigsToApi(updatedConfigs);
    }
    isDirtyRef.current = false;
    setIsDirty(false);
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
    markDirty();
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
    markDirty();
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
    markDirty();
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
                  className={`flex-1 border border-slate-300 rounded-2xl px-3 py-2 text-sm focus:border-[#004446] focus:outline-none focus:ring-0 ${
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
                className="w-full border border-slate-300 rounded-2xl px-3 py-2 text-sm focus:border-[#004446] focus:outline-none focus:ring-0"
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
                className="w-full border border-slate-300 rounded-2xl px-3 py-2 text-sm focus:border-[#004446] focus:outline-none focus:ring-0"
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

  if (hydrating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-48 h-4 bg-slate-200 rounded mx-auto mb-3" />
          <div className="w-64 h-4 bg-slate-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 md:pt-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/dashboard/forms-overview"
                className="mb-3 inline-flex items-center gap-2 rounded-xl px-1 py-1 text-base font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Form Builder
                </h1>
                <p className="text-slate-500 mt-1">
                  Create and manage form fields for each project.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetDefaults}
                className="inline-flex items-center justify-center px-4 py-2 rounded-2xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 space-y-6">
          {/* Form Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Form Title
            </label>
            <input
              type="text"
              value={
                isProjectScopedEdit
                  ? formTitles[selectedProject] || ""
                  : createFormTitle
              }
              onChange={(e) => {
                if (isProjectScopedEdit) {
                  setFormTitles((prev) => ({
                    ...prev,
                    [selectedProject]: e.target.value,
                  }));
                } else {
                  setCreateFormTitle(e.target.value);
                }
                markDirty();
              }}
              className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:border-[#004446] focus:outline-none focus:ring-0"
              placeholder={
                isProjectScopedEdit
                  ? `${selectedProject} Quarterly Report`
                  : "e.g. Haksolok Quarterly Report"
              }
            />
          </div>

          <div className="border-t border-slate-200" />

          {/* Project Selection */}
          {isProjectScopedEdit ? (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Project
              </label>
              <div className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-500">
                {selectedProject}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Project is locked while editing. Go back to Forms Overview to
                edit a different project.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value);
                  setSelectedProject(e.target.value.trim());
                }}
                className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:border-[#004446] focus:outline-none focus:ring-0"
                placeholder="e.g. Haksolok"
              />
            </div>
          )}

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
                  onChange={(e) => {
                    setQuarterConfigs((prev) => ({
                      ...prev,
                      [selectedProject]: {
                        startMonth: e.target.value as MonthOption,
                        endMonth: prev[selectedProject]?.endMonth || "March",
                      },
                    }));
                    markDirty();
                  }}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:border-[#004446] focus:outline-none focus:ring-0 appearance-none bg-no-repeat bg-white"
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
                  onChange={(e) => {
                    setQuarterConfigs((prev) => ({
                      ...prev,
                      [selectedProject]: {
                        startMonth:
                          prev[selectedProject]?.startMonth || "January",
                        endMonth: e.target.value as MonthOption,
                      },
                    }));
                    markDirty();
                  }}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:border-[#004446] focus:outline-none focus:ring-0 appearance-none bg-no-repeat bg-white"
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

        {/* Share Form Link */}
        {(isProjectScopedEdit || newProjectName.trim()) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Share form link for{" "}
                <span className="text-slate-700">{selectedProject}</span>
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyFormLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-900 text-sm font-medium hover:bg-slate-200 transition-colors active:bg-slate-300"
              >
                <Copy className="h-4 w-4" />
                Copy Form Link
              </button>
              <a
                href={whatsappShareLink || "#"}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!whatsappShareLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
                onClick={(event) => {
                  if (!whatsappShareLink) {
                    event.preventDefault();
                  }
                }}
              >
                Share via WhatsApp
              </a>
            </div>
          </div>
          {copyMessage && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              {copyMessage}
            </p>
          )}
        </div>
        )}

        {/* Fields Section */}
        <div className="space-y-8">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isProjectScopedEdit
                    ? `${selectedProject} Form Fields`
                    : "Form Fields"}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {isProjectScopedEdit
                    ? `Edit all fields for ${selectedProject}. Modified default fields are saved as project-specific overrides.`
                    : "Add a new project above, then add fields for it."}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {isProjectScopedEdit ? (
                scopedProjectFields.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-600 text-sm">
                      No fields configured for this project.
                    </p>
                  </div>
                ) : (
                  scopedProjectFields.map((field, index) => {
                    const isDefault = defaultFields.some(
                      (df) => df.id === field.id,
                    );
                    return (
                      <div
                        key={field.id}
                        className={`bg-white rounded-2xl border p-5 transition-colors hover:border-slate-300 ${
                          isDefault ? "border-slate-200" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="inline-flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
                                {index + 1}
                              </span>
                              {isDefault && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-medium bg-slate-200 text-slate-600">
                                  Default
                                </span>
                              )}
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
                              onClick={() =>
                                moveFieldUp(field.id, "custom")
                              }
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
                              onClick={() =>
                                moveFieldDown(field.id, "custom")
                              }
                              disabled={
                                index === scopedProjectFields.length - 1
                              }
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs transition-colors ${
                                index === scopedProjectFields.length - 1
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
                              value={customLabelDrafts[field.id] ?? field.label}
                              onChange={(e) => {
                                const nextValue = e.target.value;
                                setCustomLabelDrafts((prev) => ({
                                  ...prev,
                                  [field.id]: nextValue,
                                }));
                                updateField(field.id, {
                                  label: nextValue,
                                });
                              }}
                              className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-base font-semibold focus:border-[#004446] focus:outline-none focus:ring-0"
                              placeholder={
                                field.label || "Enter label name..."
                              }
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
                                  <div className="flex items-center">
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
                                  </div>
                                  <div className="flex items-center gap-3 flex-1">
                                    {fieldTypeConfig[typeOption]?.icon}
                                    <span className="font-medium text-slate-700">
                                      {fieldTypeConfig[typeOption]
                                        ?.label || typeOption}
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
                    );
                  })
                )
              ) : selectedFields.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-600 text-sm">
                    No fields yet. Add fields for your project.
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
                          className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-base font-semibold focus:border-[#004446] focus:outline-none focus:ring-0"
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
                              <div className="flex items-center">
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
                              </div>
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
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/dashboard/forms-overview"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Form Structure"}
          </button>
        </div>

        {/* Quick Scroll Controls — hidden on mobile to avoid overlapping content */}
        {(scrollPosition.canScrollUp || scrollPosition.canScrollDown) && (
          <div className="hidden md:flex fixed right-4 top-1/2 z-40 -translate-y-1/2 flex-col gap-2 md:right-8">
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
        )}

        {/* Add Field Button — inline on mobile, fixed on desktop */}
        <div className="border-t border-slate-200 pt-6 md:border-t-0 md:pt-0">
          <button
            type="button"
            onClick={addNewField}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 md:py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add Field
          </button>
        </div>

        {/* Desktop floating Add Field FAB */}
        <button
          type="button"
          onClick={addNewField}
          className="hidden md:inline-flex items-center gap-2 fixed bottom-6 right-6 z-40 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </button>

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
