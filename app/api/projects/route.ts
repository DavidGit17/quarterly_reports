import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/auth";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { getDb, getMongoRouteErrorResponse } from "@/server/db/mongodb";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required."),
  description: z.string().optional().default(""),
  languages: z.array(z.string()).optional().default([]),
  status: z.enum(["active", "inactive", "pending"]).optional().default("active"),
});

type ProjectStatus = "active" | "inactive" | "pending";

type ProjectDocument = {
  name: string;
  nameLower: string;
  description: string;
  languages: string[];
  status: ProjectStatus;
  createdAt: Date;
};

const COLLECTION = "projects";

const getCollection = async () => {
  const db = await getDb();
  return db.collection<ProjectDocument>(COLLECTION);
};

const toProjectResponse = (doc: Partial<ProjectDocument> & { _id: ObjectId }) => ({
  id: doc._id.toString(),
  name: doc.name || "",
  description: doc.description || "",
  languages: doc.languages || [],
  status: doc.status || "active",
  createdDate: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
});

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";

    if (countOnly) {
      const collection = await getCollection();
      const total = await collection.countDocuments({});
      return NextResponse.json({ total });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const collection = await getCollection();
    const [docs, total] = await Promise.all([
      collection.find({}).sort({ nameLower: 1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments({}),
    ]);
    const projects = docs.map(toProjectResponse);

    return NextResponse.json({ projects, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json({ message: mongoError.message }, { status: mongoError.status });
    }
    return NextResponse.json({ message: "Failed to load projects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const rateLimitResult = await checkRateLimit(request, "create-project");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { name, description, languages, status } = parsed.data;

    const collection = await getCollection();
    const existing = await collection.findOne({ nameLower: name.toLowerCase() });
    if (existing) {
      return NextResponse.json({ message: "A project with this name already exists." }, { status: 409 });
    }

    const doc: ProjectDocument = {
      name,
      nameLower: name.toLowerCase(),
      description,
      languages,
      status,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      { project: created ? toProjectResponse(created) : null, message: "Project created." },
      { status: 201 },
    );
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json({ message: mongoError.message }, { status: mongoError.status });
    }
    return NextResponse.json({ message: "Failed to create project." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const rateLimitResult = await checkRateLimit(request, "update-project");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      description?: string;
      languages?: string[];
      status?: ProjectStatus;
    };

    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ message: "Project id is required." }, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ message: "Invalid project id." }, { status: 400 });
    }

    const setFields: Partial<
      Pick<ProjectDocument, "name" | "nameLower" | "description" | "languages" | "status">
    > = {};
    if (fields.name !== undefined) {
      setFields.name = fields.name.trim();
      setFields.nameLower = fields.name.trim().toLowerCase();
    }
    if (fields.description !== undefined) {
      setFields.description = fields.description.trim();
    }
    if (fields.languages !== undefined) {
      setFields.languages = fields.languages;
    }
    if (fields.status !== undefined) {
      setFields.status = fields.status;
    }

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json({ message: "No fields to update." }, { status: 400 });
    }

    const collection = await getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: setFields },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project: toProjectResponse(result.value), message: "Project updated." });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json({ message: mongoError.message }, { status: mongoError.status });
    }
    return NextResponse.json({ message: "Failed to update project." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const rateLimitResult = await checkRateLimit(request, "delete-project");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as { id?: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: "Project id is required." }, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ message: "Invalid project id." }, { status: 400 });
    }

    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted." });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json({ message: mongoError.message }, { status: mongoError.status });
    }
    return NextResponse.json({ message: "Failed to delete project." }, { status: 500 });
  }
}
