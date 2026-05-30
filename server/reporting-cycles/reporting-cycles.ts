import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";

export type ReportingCycleStatus = "upcoming" | "active" | "closed";

export type ReportingCycleDocument = {
  name: string;
  startDate: Date;
  endDate: Date;
  linkedProjects: string[];
  targetRoles: string[];
  reminderSchedule: string;
  status: ReportingCycleStatus;
  createdAt: Date;
};

export type ReportingCycleRecord = WithId<ReportingCycleDocument> & {
  _id: ObjectId;
};

const COLLECTION = "reporting_cycles";

const ensureIndexes = async () => {};

export const getReportingCyclesCollection = async (): Promise<
  Collection<ReportingCycleDocument>
> => {
  const db = await getDb();
  const collection =
    db.collection<ReportingCycleDocument>(COLLECTION);
  await ensureIndexes();
  return collection;
};

export const hasOverlap = (
  existingStart: Date,
  existingEnd: Date,
  newStart: Date,
  newEnd: Date,
): boolean => newStart < existingEnd && newEnd > existingStart;

export const toCycleResponse = (
  doc: ReportingCycleRecord,
) => ({
  id: doc._id.toString(),
  name: doc.name,
  startDate: doc.startDate.toISOString(),
  endDate: doc.endDate.toISOString(),
  linkedProjects: doc.linkedProjects,
  targetRoles: doc.targetRoles,
  reminderSchedule: doc.reminderSchedule,
  status: doc.status,
  createdAt: doc.createdAt.toISOString(),
});
