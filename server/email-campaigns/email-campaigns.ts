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
let ensureIndexesPromise: Promise<void> | null = null;

const ensureIndexes = async (
  collection: Collection<EmailCampaignDocument>,
) => {
  if (!ensureIndexesPromise) {
    ensureIndexesPromise = collection
      .createIndexes([
        {
          key: { status: 1, scheduledAt: 1 },
          name: "campaigns_status_scheduled_at_idx",
        },
        {
          key: { cycleId: 1 },
          name: "campaigns_cycle_id_idx",
        },
        {
          key: { createdAt: -1 },
          name: "campaigns_created_at_desc_idx",
        },
      ])
      .then(() => undefined);
  }
  await ensureIndexesPromise;
};

export const getEmailCampaignsCollection = async (): Promise<
  Collection<EmailCampaignDocument>
> => {
  const db = await getDb();
  const collection =
    db.collection<EmailCampaignDocument>(COLLECTION);
  await ensureIndexes(collection);
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
