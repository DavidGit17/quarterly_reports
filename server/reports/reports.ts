import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";

export type DynamicReportField = {
  fieldId: string;
  label: string;
  type: "text" | "textarea" | "number" | "file" | "choice" | "date" | "rating";
  value: string | string[];
};

export type ReportStatus =
  | "draft"
  | "submitted"
  | "approval-pending"
  | "approved"
  | "rejected";

export type ReportDocument = {
  projectName: string;
  quarter: string;
  createdBy: ObjectId;
  createdByUsername: string;
  createdAt: Date;
  status?: ReportStatus;
  fields: Record<string, string | string[]>;
  dynamicFields: DynamicReportField[];
  cycleId?: ObjectId;
};

export type ReportRecord = WithId<ReportDocument> & { _id: ObjectId };

const REPORTS_COLLECTION = "reports";

const ensureReportsIndexes = async () => {};

export const getReportsCollection = async (): Promise<
  Collection<ReportDocument>
> => {
  const db = await getDb();
  const reportsCollection = db.collection<ReportDocument>(REPORTS_COLLECTION);
  await ensureReportsIndexes();
  return reportsCollection;
};

export const toReportResponse = (report: ReportRecord) => ({
  id: report._id.toString(),
  projectName: report.projectName,
  quarter: report.quarter,
  createdBy: report.createdBy.toString(),
  createdByUsername: report.createdByUsername,
  createdAt: report.createdAt.toISOString(),
  status: report.status || "submitted",
  fields: report.fields,
  dynamicFields: report.dynamicFields,
  cycleId: report.cycleId?.toString() || null,
});
