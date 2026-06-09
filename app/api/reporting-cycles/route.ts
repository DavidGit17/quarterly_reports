import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  getReportingCyclesCollection,
  hasOverlap,
  toCycleResponse,
  type ReportingCycleDocument,
  type ReportingCycleStatus,
} from "@/server/reporting-cycles/reporting-cycles";

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status")?.trim() || "";
    const projectFilter = searchParams.get("project")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const collection = await getReportingCyclesCollection();
    const query: Record<string, unknown> = {};

    if (statusFilter) {
      query.status = statusFilter;
    }
    if (projectFilter) {
      query.linkedProjects = projectFilter;
    }

    const [docs, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);
    const cycles = docs.map(toCycleResponse);

    return NextResponse.json({ cycles, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to load reporting cycles." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const rateLimitResult = await checkRateLimit(request, "create-cycle");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as {
      name?: string;
      startDate?: string;
      endDate?: string;
      linkedProjects?: string[];
      targetRoles?: string[];
      reminderSchedule?: string;
      status?: ReportingCycleStatus;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { message: "Cycle name is required." },
        { status: 400 },
      );
    }

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { message: "Start date and end date are required." },
        { status: 400 },
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid date format." },
        { status: 400 },
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { message: "End date must be after start date." },
        { status: 400 },
      );
    }

    const newStatus = body.status || "upcoming";
    const newLinked = body.linkedProjects || [];

    const collection = await getReportingCyclesCollection();
    const existing = await collection.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { message: "A cycle with this name already exists." },
        { status: 409 },
      );
    }

    if (newStatus === "active" && newLinked.length > 0) {
      const activeOverlap = await collection.findOne({
        status: "active",
        linkedProjects: { $in: newLinked },
      });
      if (
        activeOverlap &&
        hasOverlap(startDate, endDate, activeOverlap.startDate, activeOverlap.endDate)
      ) {
        const startA = startDate.toISOString().slice(0, 10);
        const endA = endDate.toISOString().slice(0, 10);
        const startB = activeOverlap.startDate.toISOString().slice(0, 10);
        const endB = activeOverlap.endDate.toISOString().slice(0, 10);
        return NextResponse.json(
          {
            message: `Cannot create cycle. "${activeOverlap.name}" (${startB}–${endB}) is already active and overlaps with the same project(s) for ${startA}–${endA}. Close the existing cycle first or change the date range.`,
          },
          { status: 409 },
        );
      }
    }

    const doc: ReportingCycleDocument = {
      name,
      startDate,
      endDate,
      linkedProjects: body.linkedProjects || [],
      targetRoles: body.targetRoles || [],
      reminderSchedule: body.reminderSchedule || "",
      status: body.status || "upcoming",
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      {
        cycle: created ? toCycleResponse(created) : null,
        message: "Reporting cycle created.",
      },
      { status: 201 },
    );
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to create reporting cycle." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const rateLimitResult = await checkRateLimit(request, "update-cycle");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      startDate?: string;
      endDate?: string;
      linkedProjects?: string[];
      targetRoles?: string[];
      reminderSchedule?: string;
      status?: ReportingCycleStatus;
    };

    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json(
        { message: "Cycle id is required." },
        { status: 400 },
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { message: "Invalid cycle id." },
        { status: 400 },
      );
    }

    const setFields: Partial<
      Pick<
        ReportingCycleDocument,
        "name" | "startDate" | "endDate" | "linkedProjects" | "targetRoles" | "reminderSchedule" | "status"
      >
    > = {};
    if (fields.name !== undefined) {
      setFields.name = fields.name.trim();
    }
    if (fields.startDate !== undefined) {
      const d = new Date(fields.startDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "Invalid start date format." },
          { status: 400 },
        );
      }
      setFields.startDate = d;
    }
    if (fields.endDate !== undefined) {
      const d = new Date(fields.endDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "Invalid end date format." },
          { status: 400 },
        );
      }
      setFields.endDate = d;
    }
    if (fields.linkedProjects !== undefined) {
      setFields.linkedProjects = fields.linkedProjects;
    }
    if (fields.targetRoles !== undefined) {
      setFields.targetRoles = fields.targetRoles;
    }
    if (fields.reminderSchedule !== undefined) {
      setFields.reminderSchedule = fields.reminderSchedule;
    }
    if (fields.status !== undefined) {
      setFields.status = fields.status;
    }

    const collection = await getReportingCyclesCollection();
    const newStatus = setFields.status as string | undefined;
    const newLinked = setFields.linkedProjects as string[] | undefined;

    if (newStatus === "active" && newLinked && newLinked.length > 0) {
      const overlapDoc = await collection.findOne({
        _id: { $ne: objectId },
        status: "active",
        linkedProjects: { $in: newLinked },
      });
      if (
        overlapDoc &&
        hasOverlap(
          (setFields.startDate as Date) || overlapDoc.startDate,
          (setFields.endDate as Date) || overlapDoc.endDate,
          overlapDoc.startDate,
          overlapDoc.endDate,
        )
      ) {
        return NextResponse.json(
          {
            message: `Cannot activate cycle. "${overlapDoc.name}" is already active with overlapping dates and shared project(s). Close it first or change the date range.`,
          },
          { status: 409 },
        );
      }
    }

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json(
        { message: "No fields to update." },
        { status: 400 },
      );
    }

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: setFields },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return NextResponse.json(
        { message: "Reporting cycle not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      cycle: toCycleResponse(result.value),
      message: "Reporting cycle updated.",
    });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to update reporting cycle." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const rateLimitResult = await checkRateLimit(request, "delete-cycle");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as { id?: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Cycle id is required." },
        { status: 400 },
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { message: "Invalid cycle id." },
        { status: 400 },
      );
    }

    const collection = await getReportingCyclesCollection();
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Reporting cycle not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Reporting cycle deleted." });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to delete reporting cycle." },
      { status: 500 },
    );
  }
}
