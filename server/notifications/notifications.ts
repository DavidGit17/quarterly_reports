import { ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";

export type NotificationType = "form_sent" | "form_failed" | "system" | "alert" | "approval" | "report";

export type NotificationDocument = {
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
};

export type NotificationRecord = WithId<NotificationDocument> & { _id: ObjectId };

const COLLECTION = "notifications";

const ensureIndexes = async () => {};

export const getNotificationsCollection = async () => {
  const db = await getDb();
  return db.collection<NotificationDocument>(COLLECTION);
};

export const toNotificationResponse = (doc: NotificationRecord) => ({
  id: doc._id.toString(),
  type: doc.type,
  title: doc.title,
  message: doc.message,
  read: doc.read,
  actionUrl: doc.actionUrl || null,
  createdAt: doc.createdAt.toISOString(),
});
