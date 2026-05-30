import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";

export type CampaignStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed";

export type CampaignType = "cycle-start" | "reminder" | "manual";

export type EmailCampaignDocument = {
  name: string;
  campaignType: CampaignType;
  cycleId: ObjectId;
  projectName: string;
  targetRoles: string[];
  scheduledAt: Date;
  sentAt?: Date;
  status: CampaignStatus;
  recipientCount?: number;
  errorMessage?: string;
  createdAt: Date;
};

export type EmailCampaignRecord = WithId<EmailCampaignDocument> & {
  _id: ObjectId;
};

const COLLECTION = "email_campaigns";

const ensureIndexes = async () => {};

export const getEmailCampaignsCollection = async (): Promise<
  Collection<EmailCampaignDocument>
> => {
  const db = await getDb();
  const collection =
    db.collection<EmailCampaignDocument>(COLLECTION);
  await ensureIndexes();
  return collection;
};

export const toCampaignResponse = (
  doc: EmailCampaignRecord,
) => ({
  id: doc._id.toString(),
  name: doc.name,
  campaignType: doc.campaignType,
  cycleId: doc.cycleId.toString(),
  projectName: doc.projectName,
  targetRoles: doc.targetRoles,
  scheduledAt: doc.scheduledAt.toISOString(),
  sentAt: doc.sentAt?.toISOString() || null,
  status: doc.status,
  recipientCount: doc.recipientCount || 0,
  errorMessage: doc.errorMessage || null,
  createdAt: doc.createdAt.toISOString(),
});
