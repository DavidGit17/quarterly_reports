import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { getDb, getMongoRouteErrorResponse } from "@/server/db/mongodb";

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

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const collection = await getCollection();
    const docs = await collection.find({}).sort({ nameLower: 1 }).toArray();
    const projects = docs.map(toProjectResponse);

    return NextResponse.json({ projects });
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

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      languages?: string[];
      status?: ProjectStatus;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ message: "Project name is required." }, { status: 400 });
    }

    const collection = await getCollection();
    const existing = await collection.findOne({ nameLower: name.toLowerCase() });
    if (existing) {
      return NextResponse.json({ message: "A project with this name already exists." }, { status: 409 });
    }

    const doc: ProjectDocument = {
      name,
      nameLower: name.toLowerCase(),
      description: body.description?.trim() || "",
      languages: body.languages || [],
      status: body.status || "active",
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

    const setFields: Record<string, unknown> = {};
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

    if (!result) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project: toProjectResponse(result), message: "Project updated." });
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
