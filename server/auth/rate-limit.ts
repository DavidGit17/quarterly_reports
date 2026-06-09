import { getDb } from "@/server/db/mongodb";

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const COLLECTION = "rate_limits";
type RateLimitDocument = {
  key: string;
  count: number;
  createdAt: Date;
  expiresAt: Date;
};
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  "send-otp": { windowMs: 60 * 1000, maxRequests: 3 },
  "verify-otp": { windowMs: 60 * 1000, maxRequests: 10 },
  login: { windowMs: 60 * 1000, maxRequests: 10 },
  signup: { windowMs: 60 * 1000, maxRequests: 5 },
  "forgot-password": { windowMs: 60 * 1000, maxRequests: 3 },
  "reset-password": { windowMs: 60 * 1000, maxRequests: 3 },
  "create-project": { windowMs: 60 * 1000, maxRequests: 20 },
  "update-project": { windowMs: 60 * 1000, maxRequests: 20 },
  "delete-project": { windowMs: 60 * 1000, maxRequests: 10 },
  "create-cycle": { windowMs: 60 * 1000, maxRequests: 20 },
  "update-cycle": { windowMs: 60 * 1000, maxRequests: 20 },
  "delete-cycle": { windowMs: 60 * 1000, maxRequests: 10 },
  "create-campaign": { windowMs: 60 * 1000, maxRequests: 10 },
  "update-campaign": { windowMs: 60 * 1000, maxRequests: 20 },
  "delete-campaign": { windowMs: 60 * 1000, maxRequests: 10 },
  "create-user": { windowMs: 60 * 1000, maxRequests: 20 },
  "update-user": { windowMs: 60 * 1000, maxRequests: 30 },
  "delete-user": { windowMs: 60 * 1000, maxRequests: 10 },
  "create-report": { windowMs: 60 * 1000, maxRequests: 10 },
  "create-distribution": { windowMs: 60 * 1000, maxRequests: 10 },
  "update-distribution": { windowMs: 60 * 1000, maxRequests: 10 },
  "delete-distribution": { windowMs: 60 * 1000, maxRequests: 10 },
  "send-now": { windowMs: 60 * 1000, maxRequests: 5 },
  "force-unlock": { windowMs: 60 * 1000, maxRequests: 5 },
  "update-storage": { windowMs: 60 * 1000, maxRequests: 30 },
  "update-report": { windowMs: 60 * 1000, maxRequests: 10 },
};

let indexesEnsured = false;

const ensureIndexes = async () => {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    const db = await getDb();
    const collection = db.collection<RateLimitDocument>(COLLECTION);
    await collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
    await collection.createIndex(
      { key: 1, createdAt: -1 },
    );
  } catch (err) {
    // IndexOptionsConflict (code 85) means the index already exists — non-fatal
    if ((err as { code?: number })?.code !== 85) {
      console.warn("[RATE_LIMIT] Index creation failed (non-fatal):", err);
    }
  }
};

const getIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
};

export const checkRateLimit = async (
  request: Request,
  endpoint: string,
  config?: Partial<RateLimitConfig>,
) => {
  const resolved: RateLimitConfig = {
    ...DEFAULT_CONFIGS[endpoint],
    windowMs: 60_000,
    maxRequests: 10,
    ...config,
  };

  const ip = getIp(request);
  const key = `${endpoint}:${ip}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - resolved.windowMs);

  await ensureIndexes();

  const db = await getDb();
  const collection = db.collection<RateLimitDocument>(COLLECTION);

  const result = await collection.findOneAndUpdate(
    { key, createdAt: { $gte: windowStart } },
    { $inc: { count: 1 } },
    { returnDocument: "after" },
  );

  if (result.value) {
    if (result.value.count > resolved.maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: resolved.maxRequests - result.value.count };
  }

  const expiresAt = new Date(now.getTime() + resolved.windowMs);
  await collection.insertOne({
    key,
    count: 1,
    createdAt: now,
    expiresAt,
  });

  return { allowed: true, remaining: resolved.maxRequests - 1 };
};
