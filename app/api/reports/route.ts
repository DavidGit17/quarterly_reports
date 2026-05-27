import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireActiveUser } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  getReportsCollection,
  toReportResponse,
  type DynamicReportField,
} from "@/server/reports/reports";

type CreateReportPayload = {
  projectName?: string;
  quarter?: string;
  fields?: Record<string, string | string[]>;
  dynamicFields?: DynamicReportField[];
  cycleId?: string;
};

const hasEmptyFieldValue = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return !value.trim();
};

export async function POST(request: Request) {
  try {
    const { user: currentUser, error } = await requireActiveUser();

    if (error || !currentUser) {
      return NextResponse.json(
        { message: error!.message },
        { status: error!.status },
      );
    }

    if (currentUser.role !== "coordinator" && currentUser.role !== "facilitator") {
      return NextResponse.json(
        { message: "Only coordinators and facilitators can submit reports." },
        { status: 403 },
      );
    }

    const payload = (await request.json()) as CreateReportPayload;

    const projectName = payload.projectName?.trim() || "";
    const quarter = payload.quarter?.trim() || "";
    const fields = payload.fields || {};
    const dynamicFields = payload.dynamicFields || [];
    const cycleId = payload.cycleId?.trim() || "";

    const assignedProject = currentUser.project?.trim() || "";

    if (!assignedProject) {
      return NextResponse.json(
        { message: "Project is not assigned to this coordinator." },
        { status: 403 },
      );
    }

    if (!quarter) {
      return NextResponse.json(
        { message: "Quarter is required." },
        { status: 400 },
      );
    }

    if (
      projectName &&
      projectName.toLowerCase() !== assignedProject.toLowerCase()
    ) {
      return NextResponse.json({ message: "Access Denied" }, { status: 403 });
    }

    if (Object.keys(fields).length === 0 || dynamicFields.length === 0) {
      return NextResponse.json(
        { message: "Report fields are required." },
        { status: 400 },
      );
    }

    const hasInvalidField = Object.values(fields).some(hasEmptyFieldValue);

    if (hasInvalidField) {
      return NextResponse.json(
        { message: "All report fields must be filled." },
        { status: 400 },
      );
    }

    const reportsCollection = await getReportsCollection();
    const createdAt = new Date();

    const insertResult = await reportsCollection.insertOne({
      projectName: assignedProject,
      quarter,
      createdBy: new ObjectId(currentUser.id),
      createdByUsername: currentUser.username,
      createdAt,
      status: "submitted",
      fields,
      dynamicFields,
      ...(cycleId ? { cycleId: new ObjectId(cycleId) } : {}),
    });

    return NextResponse.json(
      {
        report: {
          id: insertResult.insertedId.toString(),
          projectName: assignedProject,
          quarter,
          createdBy: currentUser.id,
          createdByUsername: currentUser.username,
          createdAt: createdAt.toISOString(),
          status: "submitted",
          fields,
          dynamicFields,
          cycleId: cycleId || null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }

    return NextResponse.json(
      { message: "Failed to submit report." },
      { status: 500 },
    );
  }
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  try {
    const { user: currentUser, error } = await requireActiveUser();

    if (error || !currentUser) {
      return NextResponse.json(
        { message: error!.message },
        { status: error!.status },
      );
    }

    if (currentUser.role !== "admin" && currentUser.role !== "facilitator") {
      return NextResponse.json(
        { message: "Only admins and facilitators can access all reports." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)));
    const search = searchParams.get("search")?.trim() || "";
    const projectFilter = searchParams.get("project")?.trim() || "";
    const statusFilter = searchParams.get("status")?.trim() || "";
    const quarterFilter = searchParams.get("quarter")?.trim() || "";
    const cycleIdFilter = searchParams.get("cycleId")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (projectFilter) {
      query.projectName = projectFilter;
    }
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (quarterFilter) {
      query.quarter = quarterFilter;
    }
    if (cycleIdFilter) {
      try {
        query.cycleId = new ObjectId(cycleIdFilter);
      } catch {
        return NextResponse.json(
          { message: "Invalid cycle id." },
          { status: 400 },
        );
      }
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { projectName: { $regex: escaped, $options: "i" } },
        { quarter: { $regex: escaped, $options: "i" } },
        { createdByUsername: { $regex: escaped, $options: "i" } },
      ];
    }

    const reportsCollection = await getReportsCollection();

    const skip = (page - 1) * limit;
    const [total, reports] = await Promise.all([
      reportsCollection.countDocuments(query),
      reportsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return NextResponse.json({
      reports: reports.map(toReportResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch reports." },
      { status: 500 },
    );
  }
}
