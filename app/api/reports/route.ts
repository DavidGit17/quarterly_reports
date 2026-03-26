import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getReportsCollection,
  toReportResponse,
  type DynamicReportField,
} from "@/lib/reports";

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

  if (!projectName || !quarter) {
    return NextResponse.json(
      { message: "Project name and quarter are required." },
      { status: 400 },
    );
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

  const insertResult = await reportsCollection.insertOne({
    projectName,
    quarter,
    createdBy: new ObjectId(currentUser.id),
    createdByUsername: currentUser.username,
    createdAt: new Date(),
    fields,
    dynamicFields,
  });

  const createdReport = await reportsCollection.findOne({
    _id: insertResult.insertedId,
  });

  if (!createdReport) {
    return NextResponse.json(
      { message: "Failed to create report." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { report: toReportResponse(createdReport) },
    { status: 201 },
  );
}

export async function GET() {
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
}
