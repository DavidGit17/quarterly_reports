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
let ensureIndexesPromise: Promise<void> | null = null;

const ensureIndexes = async (
  collection: Collection<SendHistoryDocument>,
) => {
  if (!ensureIndexesPromise) {
    ensureIndexesPromise = collection
      .createIndexes([
        {
          key: { ruleId: 1, sentAt: -1 },
          name: "send_history_rule_id_sent_at_idx",
        },
        {
          key: { sentAt: -1 },
          name: "send_history_sent_at_desc_idx",
        },
        {
          key: { recipientEmail: 1, sentAt: -1 },
          name: "send_history_recipient_email_sent_at_idx",
        },
      ])
      .then(() => undefined);
  }
  await ensureIndexesPromise;
};

export const getSendHistoryCollection = async () => {
  const db = await getDb();
  const collection = db.collection<SendHistoryDocument>(COLLECTION);
  await ensureIndexes(collection);
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
