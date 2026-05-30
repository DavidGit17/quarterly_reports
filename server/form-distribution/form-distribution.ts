import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";

export type ScheduleType = "monthly" | "quarterly" | "custom";

export type ScheduleConfig = {
  day?: number;
  months?: number[];
  monthDays?: Record<number, number>;
  date?: string;
  time?: string;
};

export type RuleStatus = "active" | "paused" | "disabled";

export type DistributionRuleDocument = {
  name: string;
  projects: string[];
  forms: string[];
  recipients: "coordinators" | "facilitators" | "both" | "specific";
  specificUsers: string[];
  scheduleType: ScheduleType;
  scheduleConfig: ScheduleConfig;
  emailSubject: string;
  customMessage: string;
  invitationMessage: string;
  allowEdits: boolean;
  deadline: string;
  expirationDate: string;
  status: RuleStatus;
  lastSentAt: Date | null;
  nextSendAt: Date | null;
  createdAt: Date;
  // Processing lock — prevents duplicate execution across cron runs
  processingStartedAt?: Date | null;
  processingInstanceId?: string | null;
  processingCursor?: number | null;
};

export type DistributionRuleRecord = WithId<DistributionRuleDocument> & {
  _id: ObjectId;
};

const COLLECTION = "form_distribution_rules";

const ensureIndexes = async () => {};

export const getFormDistributionCollection = async () => {
  const db = await getDb();
  const collection =
    db.collection<DistributionRuleDocument>(COLLECTION);
  await ensureIndexes();
  return collection;
};

const parseTime = (time?: string): { hours: number; minutes: number } => {
  if (!time) return { hours: 8, minutes: 0 };
  const [h, m] = time.split(":").map(Number);
  return { hours: h || 8, minutes: m || 0 };
};

const applyTime = (date: Date, time?: string): Date => {
  const { hours, minutes } = parseTime(time);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const computeNextSendDate = (
  scheduleType: ScheduleType,
  scheduleConfig: ScheduleConfig,
): Date | null => {
  const now = new Date();

  if (scheduleType === "monthly" && scheduleConfig.day) {
    const next = new Date(now.getFullYear(), now.getMonth(), scheduleConfig.day);
    applyTime(next, scheduleConfig.time);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  if (scheduleType === "quarterly" && scheduleConfig.months?.length) {
    const currentYear = now.getFullYear();
    const sorted = [...scheduleConfig.months].sort((a, b) => a - b);
    const currentMonth = now.getMonth() + 1;
    let nextMonth = sorted.find((m) => m >= currentMonth);
    if (nextMonth === undefined) {
      nextMonth = sorted[0] + 12;
    }
    let year = currentYear;
    if (nextMonth > 12) {
      nextMonth -= 12;
      year += 1;
    }
    const day = scheduleConfig.monthDays?.[nextMonth] ?? scheduleConfig.day ?? 1;
    const next = new Date(year, nextMonth - 1, day);
    applyTime(next, scheduleConfig.time);
    if (next <= now) {
      next.setFullYear(next.getFullYear() + 1);
    }
    return next;
  }

  if (scheduleType === "custom" && scheduleConfig.date) {
    const d = new Date(scheduleConfig.date);
    applyTime(d, scheduleConfig.time);
    return d > now ? d : null;
  }

  return null;
};

export const toRuleResponse = (doc: DistributionRuleRecord) => ({
  id: doc._id.toString(),
  name: doc.name,
  projects: doc.projects,
  forms: doc.forms,
  recipients: doc.recipients,
  specificUsers: doc.specificUsers,
  scheduleType: doc.scheduleType,
  scheduleConfig: doc.scheduleConfig,
  emailSubject: doc.emailSubject,
  customMessage: doc.customMessage,
  invitationMessage: doc.invitationMessage,
  allowEdits: doc.allowEdits,
  deadline: doc.deadline,
  expirationDate: doc.expirationDate,
  status: doc.status,
  lastSentAt: doc.lastSentAt?.toISOString() || null,
  nextSendAt: doc.nextSendAt?.toISOString() || null,
  createdAt: doc.createdAt.toISOString(),
  processingStartedAt: doc.processingStartedAt?.toISOString() || null,
  processingInstanceId: doc.processingInstanceId || null,
  processingCursor: doc.processingCursor ?? null,
});
