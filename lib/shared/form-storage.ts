export type DynamicFieldType =
  | "text"
  | "textarea"
  | "number"
  | "file"
  | "choice"
  | "rating"
  | "date";

export type FormFieldConfig = {
  id: string;
  label: string;
  type: DynamicFieldType;
  required?: boolean;
  // Choice field options
  choices?: string[];
  // Rating field options
  ratingLevels?: number;
  ratingSymbol?: string;
};

export type ProjectFormConfigs = Record<string, FormFieldConfig[]>;

export type MonthOption =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";

export type ProjectQuarterConfig = {
  startMonth: MonthOption;
  endMonth: MonthOption;
};

export type ProjectQuarterConfigs = Record<string, ProjectQuarterConfig>;

export const COORDINATOR_PROJECT_OPTIONS = [
  "Haksolok",
  "Sukacita",
  "Tunas",
  "Murna",
  "Ninjay",
  "SuViMung",
  "Hiba",
] as const;

const FORM_CONFIGS_STORAGE_KEY = "project-form-configs";
const DEFAULT_FIELDS_STORAGE_KEY = "project-default-form-fields";
const FORM_QUARTER_STORAGE_KEY = "project-form-quarters";

export const MONTH_OPTIONS: MonthOption[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const sharedDefaultFields: FormFieldConfig[] = [
  {
    id: "language-name",
    label: "1.Language Name",
    type: "text",
    required: true,
  },
  {
    id: "reporting-person",
    label: "2.Reporting Person",
    type: "text",
    required: true,
  },
  {
    id: "reporting-date",
    label: "3.Reporting Date",
    type: "date",
    required: true,
  },
  {
    id: "quarter-outcomes-ended",
    label: "4.Out comes from the Quarter just ended",
    type: "textarea",
    required: true,
  },
  {
    id: "newly-added-books",
    label: "5.Newly Added Books if any",
    type: "textarea",
    required: true,
  },
  {
    id: "goals-next-quarter",
    label: "6. Goals for the Next Quarter",
    type: "textarea",
    required: true,
  },
  {
    id: "outputs-vision-sharing",
    label: "7. Outputs:  Vision Sharing and Mobilization",
    type: "textarea",
    required: true,
  },
  {
    id: "outputs-local-church",
    label:
      "8. Outputs:  Equip the local Church and Community for Church Based Bible Translation",
    type: "textarea",
    required: true,
  },
  {
    id: "outputs-bible-translation",
    label: "9. Outputs:  Bible Translation",
    type: "textarea",
    required: true,
  },
  {
    id: "outputs-engagement",
    label: "10. Outputs:  Engagement and Transformation",
    type: "textarea",
    required: true,
  },
  {
    id: "project-impact",
    label:
      "11.Project Impact ( Please make sure that the stories answer the Question who, what ,when, where , and Why.) Where relevant clearly indicate any conditions. Like Testimonies",
    type: "textarea",
    required: true,
  },
  {
    id: "non-translation-activities",
    label:
      "12.Non-translation Activities. Bible listening Groups and Dedications etc..)",
    type: "textarea",
    required: true,
  },
  {
    id: "task-gospel-understanding",
    label:
      "13.Tell about a Task or activity that helped the team or community Members to better understand God Scripture or the Gospel Message",
    type: "textarea",
    required: true,
  },
  {
    id: "other-developments",
    label: "14.Describe any other interesting developments or challenges.",
    type: "textarea",
    required: true,
  },
  {
    id: "prayer-requests",
    label:
      "15. Please provide prayer requests and updates that relate to the entire project. ( By the project Coordinator ONLY )",
    type: "textarea",
    required: true,
  },
  {
    id: "answered-prayer-date",
    label: "16.Answered prayer request and Date",
    type: "textarea",
    required: true,
  },
  {
    id: "project-photos-a",
    label:
      "17.\nPlease provide at least 10  photos  (highest resolution available) or videos illustrating project activities and/or their impact on the project.  Rename them saying what's happening in the Photo.\n\n(Non-anonymous question\n)",
    type: "file",
    required: true,
  },
  {
    id: "project-photos-b",
    label:
      "18.Please provide at least 10  photos  (highest resolution available) or videos illustrating project activities and/or their impact on the project.  Rename them saying what's happening in the Photo.\n\n(Non-anonymous question\n)",
    type: "file",
    required: true,
  },
  {
    id: "external-environment",
    label:
      "19.Describe any key developments and changes in the external environment of the project (country, region, district) that had an influence (positive or negative) on the project.",
    type: "textarea",
    required: true,
  },
  {
    id: "team-functioning",
    label:
      "20.Describe how the team that is responsible for the implementation of the project is functioning.",
    type: "textarea",
    required: true,
  },
  {
    id: "other-challenges",
    label:
      "21.Are there any other challenges that have an influence on the implementation of the project (partners, resources, logistics, etc.)? How do you plan to address those challenges?",
    type: "textarea",
    required: true,
  },
  {
    id: "partners-church-list",
    label:
      "22. Partners:  List all of the  Church names  that are involved in the project so far.\n*This is a Cluster Question. You can assign different responses based on Language.",
    type: "textarea",
    required: true,
  },
  {
    id: "progress-chart-upload",
    label: "23.Upload  updated  progress chart:\n\n(Non-anonymous question\n)",
    type: "file",
    required: true,
  },
  {
    id: "documents-upload",
    label: "24.Upload Documents\n\n(Non-anonymous question\n)",
    type: "file",
    required: true,
  },
  {
    id: "grammar-check",
    label: "25.Is this report checked for Grammar corrections?!",
    type: "choice",
    choices: ["Yes", "No", "Maybe"],
    required: true,
  },
  {
    id: "tr-manager-check",
    label: "26.Is this report checked and approved by TR manager?!",
    type: "choice",
    choices: ["Yes", "No", "Maybe"],
    required: true,
  },
  {
    id: "form-improvement-suggestions",
    label: "27.Any suggestions to improve this reporting form?!!",
    type: "textarea",
    required: true,
  },
];

const defaultFormConfigs: ProjectFormConfigs = {
  Haksolok: sharedDefaultFields,
  Sukacita: sharedDefaultFields,
  Tunas: sharedDefaultFields,
  Murna: sharedDefaultFields,
  Ninjay: sharedDefaultFields,
  SuViMung: sharedDefaultFields,
  Hiba: sharedDefaultFields,
};

const defaultQuarterConfigs: ProjectQuarterConfigs = Object.fromEntries(
  Object.keys(defaultFormConfigs).map((project) => [
    project,
    { startMonth: "January", endMonth: "March" },
  ]),
) as ProjectQuarterConfigs;

export const toProjectSlug = (projectName: string) =>
  projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getProjectNameFromSlug = (
  projectSlug: string,
  configs: ProjectFormConfigs,
): string | null => {
  const normalized = projectSlug.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const allKnownProjects = new Set([
    ...Object.keys(defaultFormConfigs),
    ...COORDINATOR_PROJECT_OPTIONS,
    ...Object.keys(configs),
  ]);

  for (const projectName of allKnownProjects) {
    if (toProjectSlug(projectName) === normalized) {
      return projectName;
    }
  }

  return null;
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

export const getBaseDefaultFields = () => sharedDefaultFields;
export const getDefaultFormConfigs = () => defaultFormConfigs;

const getValidProjectKeys = () => Object.keys(defaultFormConfigs);

export const getCustomFieldsFromConfigs = (
  configs: ProjectFormConfigs,
  defaultFields: FormFieldConfig[],
): ProjectFormConfigs => {
  const defaultIds = new Set(defaultFields.map((field) => field.id));
  const custom: ProjectFormConfigs = {};

  for (const [project, fields] of Object.entries(configs)) {
    custom[project] = (fields || []).filter(
      (field) => !defaultIds.has(field.id),
    );
  }

  return custom;
};

export const buildFormConfigs = (
  defaultFields: FormFieldConfig[],
  customConfigs: ProjectFormConfigs,
): ProjectFormConfigs => {
  const normalizedConfigs: ProjectFormConfigs = {};

  for (const projectKey of getValidProjectKeys()) {
    normalizedConfigs[projectKey] = [
      ...defaultFields,
      ...(customConfigs[projectKey] || []),
    ];
  }

  return normalizedConfigs;
};

export const getDefaultFields = (): FormFieldConfig[] => {
  if (!ensureBrowser()) {
    return sharedDefaultFields;
  }

  const savedDefaults = safeParse<FormFieldConfig[]>(
    localStorage.getItem(DEFAULT_FIELDS_STORAGE_KEY),
    [],
  );

  // Get all core field IDs from the base sharedDefaultFields
  const coreFieldIds = new Set(sharedDefaultFields.map((field) => field.id));
  // Check if all core field IDs are present in savedDefaults
  const hasAllCoreFields = Array.from(coreFieldIds).every((coreId) =>
    savedDefaults.some((field) => field.id === coreId),
  );

  // If there are no saved defaults, or if saved defaults are missing ANY of our core fields
  // re-initialize with the sharedDefaultFields to fix any corrupted state
  if (savedDefaults.length === 0 || !hasAllCoreFields) {
    // Clear any corrupted saved defaults
    localStorage.removeItem(DEFAULT_FIELDS_STORAGE_KEY);
    saveDefaultFields(sharedDefaultFields);
    return sharedDefaultFields;
  }

  // If we have valid saved defaults (all core fields exist), use those - this preserves any edits/additions made in the form builder
  return savedDefaults;
};

export const saveDefaultFields = (fields: FormFieldConfig[]) => {
  if (!ensureBrowser()) {
    return;
  }

  localStorage.setItem(DEFAULT_FIELDS_STORAGE_KEY, JSON.stringify(fields));
};

export const getCustomFormConfigs = (): ProjectFormConfigs => {
  if (!ensureBrowser()) {
    return {};
  }

  const saved = safeParse<ProjectFormConfigs>(
    localStorage.getItem(FORM_CONFIGS_STORAGE_KEY),
    {},
  );

  if (Object.keys(saved).length === 0) {
    return {};
  }

  const defaultFields = getDefaultFields();

  // If we have less than 27 default fields, we're in a legacy state
  // Don't filter out fields if we're still using old defaults
  if (defaultFields.length < 27) {
    return saved;
  }

  return getCustomFieldsFromConfigs(saved, defaultFields);
};
export const getDefaultQuarterConfigs = () => defaultQuarterConfigs;

export const cleanupUnwantedFields = (): void => {
  if (!ensureBrowser()) {
    return;
  }

  const unwantedLabels = ["Region Name", "Team Size", "Main Project Update"];
  const saved = safeParse<ProjectFormConfigs>(
    localStorage.getItem(FORM_CONFIGS_STORAGE_KEY),
    {},
  );

  let hasChanges = false;
  for (const [project, fields] of Object.entries(saved)) {
    const filtered = (fields || []).filter(
      (field) => !unwantedLabels.includes(field.label),
    );
    if (filtered.length !== fields.length) {
      saved[project] = filtered;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveFormConfigs(saved);
  }
};

export const getFormConfigs = (): ProjectFormConfigs => {
  // Clean up unwanted fields on load
  cleanupUnwantedFields();

  // Clear any old saved projects from localStorage that aren't in our current valid list
  if (ensureBrowser()) {
    const validProjects = new Set(getValidProjectKeys());
    const savedConfigs = safeParse<ProjectFormConfigs>(
      localStorage.getItem(FORM_CONFIGS_STORAGE_KEY),
      {},
    );

    // Remove any saved projects that aren't in our current valid list
    let hasChanges = false;
    for (const projectName of Object.keys(savedConfigs)) {
      if (!validProjects.has(projectName)) {
        delete savedConfigs[projectName];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      saveFormConfigs(savedConfigs);
    }
  }

  const defaultFields = getDefaultFields();
  const customConfigs = getCustomFormConfigs();
  return buildFormConfigs(defaultFields, customConfigs);
};

export const getProjectQuarters = (): ProjectQuarterConfigs => {
  if (!ensureBrowser()) {
    return defaultQuarterConfigs;
  }

  const saved = safeParse<ProjectQuarterConfigs>(
    localStorage.getItem(FORM_QUARTER_STORAGE_KEY),
    {},
  );

  if (Object.keys(saved).length === 0) {
    return defaultQuarterConfigs;
  }

  return {
    ...defaultQuarterConfigs,
    ...saved,
  };
};

export const saveProjectQuarters = (quarters: ProjectQuarterConfigs) => {
  if (!ensureBrowser()) {
    return;
  }

  localStorage.setItem(FORM_QUARTER_STORAGE_KEY, JSON.stringify(quarters));
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

const API_CONFIG_URL = "/api/form-configs";

let cachedFormConfigs: ProjectFormConfigs | null = null;
let cachedDefaultFields: FormFieldConfig[] | null = null;
let cachedQuarterConfigs: ProjectQuarterConfigs | null = null;

const apiUrl = (cacheBust = false) =>
  cacheBust ? `${API_CONFIG_URL}?_ts=${Date.now()}` : API_CONFIG_URL;

const fetchApiConfigs = async (): Promise<Record<string, string> | null> => {
  try {
    const res = await fetch(apiUrl(true));
    if (!res.ok) {
      console.warn(
        "[form-storage] API GET failed:",
        res.status,
        res.statusText,
      );
      return null;
    }
    return (await res.json()) as Record<string, string>;
  } catch (err) {
    console.warn("[form-storage] API GET error:", err);
    return null;
  }
};

export type HydratedFormState = {
  defaultFields: FormFieldConfig[];
  customConfigs: ProjectFormConfigs;
  formConfigs: ProjectFormConfigs;
  quarterConfigs: ProjectQuarterConfigs;
};

export const getHydratedFormState = async (): Promise<HydratedFormState> => {
  let defaultFields = getDefaultFields();
  let customConfigs = getCustomFormConfigs();
  let quarterConfigs = getProjectQuarters();

  const apiConfigs = await fetchApiConfigs();

  if (apiConfigs) {
    const rawDefaults = apiConfigs["default-fields"];
    const rawProjectConfigs = apiConfigs["project-form-configs"];
    const rawQuarters = apiConfigs["quarter-configs"];

    if (rawDefaults) {
      try {
        const parsedDefaults = JSON.parse(rawDefaults) as FormFieldConfig[];
        if (Array.isArray(parsedDefaults) && parsedDefaults.length > 0) {
          defaultFields = parsedDefaults;
          saveDefaultFields(defaultFields);
        }
      } catch {
        console.warn("[form-storage] Failed to parse API default-fields");
      }
    }

    if (rawProjectConfigs) {
      try {
        const parsedConfigs = JSON.parse(
          rawProjectConfigs,
        ) as ProjectFormConfigs;
        customConfigs = getCustomFieldsFromConfigs(
          parsedConfigs || {},
          defaultFields,
        );
        saveFormConfigs(customConfigs);
      } catch {
        console.warn(
          "[form-storage] Failed to parse API project-form-configs",
        );
      }
    }

    if (rawQuarters) {
      try {
        const parsedQuarters = JSON.parse(
          rawQuarters,
        ) as ProjectQuarterConfigs;
        quarterConfigs = {
          ...defaultQuarterConfigs,
          ...(parsedQuarters || {}),
        };
        saveProjectQuarters(quarterConfigs);
      } catch {
        console.warn("[form-storage] Failed to parse API quarter-configs");
      }
    }
  }

  const formConfigs = buildFormConfigs(defaultFields, customConfigs);

  return {
    defaultFields,
    customConfigs,
    formConfigs,
    quarterConfigs,
  };
};

export const getServerFormConfigs =
  async (): Promise<ProjectFormConfigs | null> => {
    if (cachedFormConfigs) return cachedFormConfigs;
    const apiConfigs = await fetchApiConfigs();
    if (!apiConfigs) return null;
    const raw = apiConfigs["project-form-configs"];
    if (!raw) return null;
    try {
      cachedFormConfigs = JSON.parse(raw) as ProjectFormConfigs;
      return cachedFormConfigs;
    } catch {
      return null;
    }
  };

export const getServerDefaultFields = async (): Promise<
  FormFieldConfig[] | null
> => {
  if (cachedDefaultFields) return cachedDefaultFields;
  const apiConfigs = await fetchApiConfigs();
  if (!apiConfigs) return null;
  const raw = apiConfigs["default-fields"];
  if (!raw) return null;
  try {
    cachedDefaultFields = JSON.parse(raw) as FormFieldConfig[];
    return cachedDefaultFields;
  } catch {
    return null;
  }
};

export const getServerQuarterConfigs =
  async (): Promise<ProjectQuarterConfigs | null> => {
    if (cachedQuarterConfigs) return cachedQuarterConfigs;
    const apiConfigs = await fetchApiConfigs();
    if (!apiConfigs) return null;
    const raw = apiConfigs["quarter-configs"];
    if (!raw) return null;
    try {
      cachedQuarterConfigs = JSON.parse(raw) as ProjectQuarterConfigs;
      return cachedQuarterConfigs;
    } catch {
      return null;
    }
  };

export const pushFormConfigsToApi = async (
  configs: ProjectFormConfigs,
): Promise<boolean> => {
  try {
    const res = await fetch(apiUrl(true), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "project-form-configs",
        value: JSON.stringify(configs),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        "[form-storage] PUT project-form-configs failed:",
        res.status,
        body,
      );
      return false;
    }
    cachedFormConfigs = configs;
    return true;
  } catch (err) {
    console.warn("[form-storage] PUT project-form-configs error:", err);
    return false;
  }
};

export const pushDefaultFieldsToApi = async (
  fields: FormFieldConfig[],
): Promise<boolean> => {
  try {
    const res = await fetch(apiUrl(true), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "default-fields",
        value: JSON.stringify(fields),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        "[form-storage] PUT default-fields failed:",
        res.status,
        body,
      );
      return false;
    }
    cachedDefaultFields = fields;
    return true;
  } catch (err) {
    console.warn("[form-storage] PUT default-fields error:", err);
    return false;
  }
};

export const pushQuarterConfigsToApi = async (
  configs: ProjectQuarterConfigs,
): Promise<boolean> => {
  try {
    const res = await fetch(apiUrl(true), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "quarter-configs",
        value: JSON.stringify(configs),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        "[form-storage] PUT quarter-configs failed:",
        res.status,
        body,
      );
      return false;
    }
    cachedQuarterConfigs = configs;
    return true;
  } catch (err) {
    console.warn("[form-storage] PUT quarter-configs error:", err);
    return false;
  }
};

export const resetConfigCache = () => {
  cachedFormConfigs = null;
  cachedDefaultFields = null;
  cachedQuarterConfigs = null;
};

export const formatDateTime = (isoDate: string) => {
  const [datePart, timePart = ""] = isoDate.split("T");
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return { date: "-", time: "-" };
  }

  const [hours = "00", minutes = "00"] = timePart.split(":");
  const hourNumber = Number.parseInt(hours, 10);
  const displayHour = hourNumber % 12 || 12;
  const period = hourNumber >= 12 ? "PM" : "AM";

  return {
    date: `${day}/${month}/${year}`,
    time: `${displayHour}:${minutes} ${period}`,
  };
};
