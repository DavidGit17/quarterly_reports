import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/auth";
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
};

const hasEmptyFieldValue = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return !value.trim();
};

export async function POST(request: Request) {
  try {
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (currentUser.role !== "coordinator") {
      return NextResponse.json(
        { message: "Only coordinators can submit reports." },
        { status: 403 },
      );
    }

    const payload = (await request.json()) as CreateReportPayload;

    const projectName = payload.projectName?.trim() || "";
    const quarter = payload.quarter?.trim() || "";
    const fields = payload.fields || {};
    const dynamicFields = payload.dynamicFields || [];

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

export async function GET() {
  try {
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { message: "Only admins can access all reports." },
        { status: 403 },
      );
    }

    const reportsCollection = await getReportsCollection();

    const reports = await reportsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ reports: reports.map(toReportResponse) });
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
