import { getDb } from "@/server/db/mongodb";
import { ObjectId } from "mongodb";

const COLLECTION = "storage_configs";

const getCollection = async () => {
  const db = await getDb();
  return db.collection(COLLECTION);
};

export async function checkStorageQuota(
  userId: string,
  fileSize: number,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const configsCollection = await getCollection();
    const config = await configsCollection.findOne({ userId });
    if (!config) {
      return { allowed: true };
    }
    if (config.storageUsed + fileSize > config.storageLimit) {
      return { allowed: false, reason: "Storage quota exceeded" };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export async function incrementStorageUsed(
  userId: string,
  bytes: number,
): Promise<void> {
  try {
    const configsCollection = await getCollection();
    await configsCollection.updateOne(
      { userId },
      { $inc: { storageUsed: bytes }, $set: { updatedAt: new Date() } },
    );
  } catch {
    // Best-effort
  }
}
