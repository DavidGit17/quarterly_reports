import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";
import { requireAdmin } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import { ObjectId } from "mongodb";

const COLLECTION = "storage_configs";
const DEFAULT_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
const DEFAULT_MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const DEFAULT_ALLOWED_TYPES = ["PDF", "JPG", "PNG", "MP4"];

type StorageConfig = {
  _id: string;
  userId: string;
  displayId: string;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "coordinator" | "facilitator";
  project: string;
  storageLimit: number;
  storageUsed: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  createdAt: string;
  updatedAt: string;
};

const padId = (n: number) => String(n).padStart(3, "0");

const configFromDoc = (doc: Record<string, unknown>): StorageConfig => ({
  _id: (doc._id as ObjectId).toHexString(),
  userId: String(doc.userId || ""),
  displayId: String(doc.displayId || ""),
  username: String(doc.username || ""),
  fullName: String(doc.fullName || ""),
  email: String(doc.email || ""),
  role: (doc.role || "coordinator") as StorageConfig["role"],
  project: String(doc.project || ""),
  storageLimit: Number(doc.storageLimit ?? DEFAULT_STORAGE_BYTES),
  storageUsed: Number(doc.storageUsed ?? 0),
  allowedFileTypes: Array.isArray(doc.allowedFileTypes) ? doc.allowedFileTypes as string[] : DEFAULT_ALLOWED_TYPES,
  maxFileSize: Number(doc.maxFileSize ?? DEFAULT_MAX_FILE_SIZE),
  createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || ""),
  updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt || ""),
});

const getCollection = async () => {
  const db = await getDb();
  return db.collection(COLLECTION);
};

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const roleFilter = searchParams.get("role") || "all";
    const projectFilter = searchParams.get("project") || "all";
    const statusFilter = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const db = await getDb();
    const usersCollection = db.collection("users");
    const configsCollection = await getCollection();

    const allUsers = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();

    const userIds = allUsers.map((u) => (u._id as ObjectId).toHexString());
    const existingConfigs = await configsCollection.find({ userId: { $in: userIds } }).toArray();
    const configMap = new Map<string, Record<string, unknown>>();
    for (const c of existingConfigs) {
      configMap.set(String(c.userId), c as unknown as Record<string, unknown>);
    }

    let seq = 1;
    const allConfigs: StorageConfig[] = [];
    const now = new Date();

    for (const user of allUsers) {
      const uid = (user._id as ObjectId).toHexString();
      let doc = configMap.get(uid);
      if (!doc) {
        doc = {
          _id: new ObjectId(),
          userId: uid,
          displayId: `USR-${padId(seq)}`,
          username: user.username || "",
          fullName: user.fullName || user.username || "",
          email: user.email || "",
          role: user.role || "coordinator",
          project: user.project || "",
          storageLimit: DEFAULT_STORAGE_BYTES,
          storageUsed: 0,
          allowedFileTypes: DEFAULT_ALLOWED_TYPES,
          maxFileSize: DEFAULT_MAX_FILE_SIZE,
          createdAt: now,
          updatedAt: now,
        } as Record<string, unknown>;
        await configsCollection.insertOne(doc as Record<string, unknown>);
      }
      allConfigs.push(configFromDoc(doc));
      seq++;
    }

    let filtered = allConfigs;

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.displayId.toLowerCase().includes(search) ||
          c.username.toLowerCase().includes(search) ||
          c.fullName.toLowerCase().includes(search) ||
          c.project.toLowerCase().includes(search) ||
          c.role.toLowerCase().includes(search),
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((c) => c.role === roleFilter);
    }

    if (projectFilter !== "all") {
      filtered = filtered.filter((c) => c.project === projectFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => {
        const pct = c.storageLimit > 0 ? (c.storageUsed / c.storageLimit) * 100 : 0;
        switch (statusFilter) {
          case "low": return pct <= 30;
          case "medium": return pct > 30 && pct <= 60;
          case "high": return pct > 60 && pct <= 85;
          case "critical": return pct > 85;
          default: return true;
        }
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const projects = [...new Set(allConfigs.map((c) => c.project).filter(Boolean))].sort();

    const totalAllocated = allConfigs.reduce((s, c) => s + c.storageLimit, 0);
    const totalUsed = allConfigs.reduce((s, c) => s + c.storageUsed, 0);

    return NextResponse.json({
      configs: paginated,
      summary: {
        totalUsers: allConfigs.length,
        totalAllocated,
        totalUsed,
        available: totalAllocated - totalUsed,
        totalProjects: projects.length,
      },
      projects,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    return NextResponse.json(
      { message: mongoError?.message || "Unable to load storage data." },
      { status: mongoError?.status || 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const body = (await request.json()) as {
      id?: string;
      storageLimit?: number;
      maxFileSize?: number;
      allowedFileTypes?: string[];
    };

    if (!body.id) {
      return NextResponse.json({ message: "Config ID is required." }, { status: 400 });
    }

    const setFields: Record<string, unknown> = { updatedAt: new Date() };

    if (body.storageLimit !== undefined) {
      if (body.storageLimit < 1) {
        return NextResponse.json({ message: "Storage limit must be at least 1 MB." }, { status: 400 });
      }
      setFields.storageLimit = body.storageLimit;
    }

    if (body.maxFileSize !== undefined) {
      if (body.maxFileSize < 1) {
        return NextResponse.json({ message: "Max file size must be at least 1 MB." }, { status: 400 });
      }
      setFields.maxFileSize = body.maxFileSize;
    }

    if (body.allowedFileTypes !== undefined) {
      if (!Array.isArray(body.allowedFileTypes) || body.allowedFileTypes.length === 0) {
        return NextResponse.json({ message: "At least one file type must be selected." }, { status: 400 });
      }
      setFields.allowedFileTypes = body.allowedFileTypes;
    }

    const configsCollection = await getCollection();
    const result = await configsCollection.updateOne(
      { _id: new ObjectId(body.id) },
      { $set: setFields },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Storage config not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Storage configuration updated successfully." });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    return NextResponse.json(
      { message: mongoError?.message || "Unable to update storage configuration." },
      { status: mongoError?.status || 500 },
    );
  }
}
