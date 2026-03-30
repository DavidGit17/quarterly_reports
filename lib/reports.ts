import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type DynamicReportField = {
  fieldId: string;
  label: string;
  type: "text" | "textarea" | "number" | "file";
  value: string | string[];
};

export type ReportDocument = {
  projectName: string;
  quarter: string;
  createdBy: ObjectId;
  createdByUsername: string;
  createdAt: Date;
  fields: Record<string, string | string[]>;
  dynamicFields: DynamicReportField[];
};

export type ReportRecord = WithId<ReportDocument> & { _id: ObjectId };

const REPORTS_COLLECTION = "reports";
let ensureReportsIndexesPromise: Promise<void> | null = null;

const ensureReportsIndexes = async (
  reportsCollection: Collection<ReportDocument>,
) => {
  if (!ensureReportsIndexesPromise) {
    ensureReportsIndexesPromise = reportsCollection
      .createIndexes([
        {
          key: { createdAt: -1 },
          name: "reports_created_at_desc_idx",
        },
        {
          key: { createdBy: 1, createdAt: -1 },
          name: "reports_created_by_created_at_desc_idx",
        },
      ])
      .then(() => undefined);
  }

  await ensureReportsIndexesPromise;
};

export const getReportsCollection = async (): Promise<
  Collection<ReportDocument>
> => {
  const db = await getDb();
  const reportsCollection = db.collection<ReportDocument>(REPORTS_COLLECTION);
  await ensureReportsIndexes(reportsCollection);
  return reportsCollection;
};

export const toReportResponse = (report: ReportRecord) => ({
  id: report._id.toString(),
  projectName: report.projectName,
  quarter: report.quarter,
  createdBy: report.createdBy.toString(),
  createdByUsername: report.createdByUsername,
  createdAt: report.createdAt.toISOString(),
  fields: report.fields,
  dynamicFields: report.dynamicFields,
});
