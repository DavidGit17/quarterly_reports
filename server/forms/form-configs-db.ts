import { getDb } from "@/server/db/mongodb";
import type { FormFieldConfig, ProjectQuarterConfigs, ProjectFormConfigs } from "@/lib/shared/form-storage";

export type FormConfigDocument = {
  key: string;
  value: string;
  updatedAt: Date;
};

const COLLECTION = "form_configs";

const ensureIndexes = async () => {};

const getFormConfigsCollection = async () => {
  const db = await getDb();
  const collection = db.collection<FormConfigDocument>(COLLECTION);
  await ensureIndexes();
  return collection;
};

export const loadFormConfigsFromDb = async (): Promise<ProjectFormConfigs | null> => {
  try {
    const collection = await getFormConfigsCollection();
    const doc = await collection.findOne({ key: "project-form-configs" });
    if (!doc) return null;
    return JSON.parse(doc.value) as ProjectFormConfigs;
  } catch {
    return null;
  }
};

export const saveFormConfigsToDb = async (configs: ProjectFormConfigs): Promise<boolean> => {
  try {
    const collection = await getFormConfigsCollection();
    await collection.updateOne(
      { key: "project-form-configs" },
      {
        $set: {
          key: "project-form-configs",
          value: JSON.stringify(configs),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return true;
  } catch {
    return false;
  }
};

export const loadDefaultFieldsFromDb = async (): Promise<FormFieldConfig[] | null> => {
  try {
    const collection = await getFormConfigsCollection();
    const doc = await collection.findOne({ key: "default-fields" });
    if (!doc) return null;
    return JSON.parse(doc.value) as FormFieldConfig[];
  } catch {
    return null;
  }
};

export const saveDefaultFieldsToDb = async (fields: FormFieldConfig[]): Promise<boolean> => {
  try {
    const collection = await getFormConfigsCollection();
    await collection.updateOne(
      { key: "default-fields" },
      {
        $set: {
          key: "default-fields",
          value: JSON.stringify(fields),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return true;
  } catch {
    return false;
  }
};

export const loadQuarterConfigsFromDb = async (): Promise<ProjectQuarterConfigs | null> => {
  try {
    const collection = await getFormConfigsCollection();
    const doc = await collection.findOne({ key: "quarter-configs" });
    if (!doc) return null;
    return JSON.parse(doc.value) as ProjectQuarterConfigs;
  } catch {
    return null;
  }
};

export const saveQuarterConfigsToDb = async (configs: ProjectQuarterConfigs): Promise<boolean> => {
  try {
    const collection = await getFormConfigsCollection();
    await collection.updateOne(
      { key: "quarter-configs" },
      {
        $set: {
          key: "quarter-configs",
          value: JSON.stringify(configs),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return true;
  } catch {
    return false;
  }
};
