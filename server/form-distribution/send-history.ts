import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";

export type SendStatus = "sent" | "failed";

export type SendHistoryDocument = {
  ruleId: ObjectId;
  ruleName: string;
  projectName: string;
  recipientEmail: string;
  recipientUserId?: ObjectId;
  recipientRole?: string;
  formLink: string;
  status: SendStatus;
  errorMessage?: string;
  sentAt: Date;
};

export type SendHistoryRecord = WithId<SendHistoryDocument> & { _id: ObjectId };

const COLLECTION = "form_distribution_send_history";

const ensureIndexes = async () => {};

export const getSendHistoryCollection = async () => {
  const db = await getDb();
  const collection = db.collection<SendHistoryDocument>(COLLECTION);
  await ensureIndexes();
  return collection;
};

export const toSendHistoryResponse = (doc: SendHistoryRecord) => ({
  id: doc._id.toString(),
  ruleId: doc.ruleId.toString(),
  ruleName: doc.ruleName,
  projectName: doc.projectName,
  recipientEmail: doc.recipientEmail,
  recipientUserId: doc.recipientUserId?.toString() || null,
  recipientRole: doc.recipientRole || null,
  formLink: doc.formLink,
  status: doc.status,
  errorMessage: doc.errorMessage || null,
  sentAt: doc.sentAt.toISOString(),
});
