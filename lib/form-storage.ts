export type DynamicFieldType = "text" | "textarea" | "number" | "file";

export type FormFieldConfig = {
  id: string;
  label: string;
  type: DynamicFieldType;
  required?: boolean;
};

export type ProjectFormConfigs = Record<string, FormFieldConfig[]>;

const FORM_CONFIGS_STORAGE_KEY = "project-form-configs";

const defaultFormConfigs: ProjectFormConfigs = {
  Libya: [
    {
      id: "language-name",
      label: "Language Name",
      type: "text",
      required: true,
    },
    {
      id: "reporting-person",
      label: "Reporting Person",
      type: "text",
      required: true,
    },
    {
      id: "reporting-date",
      label: "Reporting Date",
      type: "text",
      required: true,
    },
    {
      id: "quarter-outcomes",
      label: "Outcomes from the quarter",
      type: "textarea",
      required: true,
    },
    {
      id: "upload-photos",
      label: "Upload Photos",
      type: "file",
      required: true,
    },
  ],
  Sudan: [
    { id: "region-name", label: "Region Name", type: "text", required: true },
    { id: "team-size", label: "Team Size", type: "number", required: true },
    {
      id: "main-update",
      label: "Main Project Update",
      type: "textarea",
      required: true,
    },
  ],
  Dubai: [
    {
      id: "project-status",
      label: "Project Status",
      type: "text",
      required: true,
    },
    { id: "budget-used", label: "Budget Used", type: "number", required: true },
    {
      id: "supporting-docs",
      label: "Upload Supporting Documents",
      type: "file",
      required: false,
    },
  ],
};

const ensureBrowser = () => typeof window !== "undefined";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getDefaultFormConfigs = () => defaultFormConfigs;

export const getFormConfigs = (): ProjectFormConfigs => {
  if (!ensureBrowser()) {
    return defaultFormConfigs;
  }

  const saved = safeParse<ProjectFormConfigs>(
    localStorage.getItem(FORM_CONFIGS_STORAGE_KEY),
    {},
  );

  if (Object.keys(saved).length === 0) {
    return defaultFormConfigs;
  }

  return saved;
};

export const saveFormConfigs = (configs: ProjectFormConfigs) => {
  if (!ensureBrowser()) {
    return;
  }

  localStorage.setItem(FORM_CONFIGS_STORAGE_KEY, JSON.stringify(configs));
};

export const getProjectConfig = (
  project: string,
  configs: ProjectFormConfigs,
): FormFieldConfig[] => {
  const trimmed = project.trim();

  if (!trimmed) {
    return [];
  }

  if (configs[trimmed]) {
    return configs[trimmed];
  }

  const matchedKey = Object.keys(configs).find(
    (key) => key.toLowerCase() === trimmed.toLowerCase(),
  );

  if (!matchedKey) {
    return [];
  }

  return configs[matchedKey];
};

export const formatDateTime = (isoDate: string) => {
  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return { date: "-", time: "-" };
  }

  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};
