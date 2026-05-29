import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireActiveUser } from "@/server/auth/auth";
import {
  getReportsCollection,
  toReportResponse,
  type ReportStatus,
} from "@/server/reports/reports";
import { getFormDistributionCollection } from "@/server/form-distribution/form-distribution";

type Params = {
  params: Promise<{ id: string }>;
};

type UpdateReportPayload = {
  status?: ReportStatus;
  dynamicFields?: Array<{
    fieldId: string;
    label: string;
    value: string | string[];
  }>;
};

const REPORT_STATUSES: ReportStatus[] = [
  "draft",
  "submitted",
  "approval-pending",
  "approved",
  "rejected",
];

export async function GET(_: Request, { params }: Params) {
  const { user: currentUser, error } = await requireActiveUser();

  if (error || !currentUser) {
    return NextResponse.json(
      { message: error!.message },
      { status: error!.status },
    );
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid report id." },
      { status: 400 },
    );
  }

  const reportsCollection = await getReportsCollection();
  const report = await reportsCollection.findOne({ _id: new ObjectId(id) });

  if (!report) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  const isAdmin = currentUser.role === "admin";
  const isOwner = report.createdBy.toString() === currentUser.id;
  const isProjectMatch =
    currentUser.role === "coordinator" || currentUser.role === "facilitator"
      ? report.projectName.toLowerCase() ===
        (currentUser.project || "").trim().toLowerCase()
      : true;

  if (!isAdmin && (!isOwner || !isProjectMatch)) {
    return NextResponse.json(
      { message: "You do not have access to this report." },
      { status: 403 },
    );
  }

  return NextResponse.json({ report: toReportResponse(report) });
}

export async function PATCH(request: Request, { params }: Params) {
  const { user: currentUser, error } = await requireActiveUser();

  if (error || !currentUser) {
    return NextResponse.json(
      { message: error!.message },
      { status: error!.status },
    );
  }

  if (currentUser.role !== "admin" && currentUser.role !== "facilitator") {
    return NextResponse.json(
      { message: "Only admins and facilitators can edit reports." },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid report id." },
      { status: 400 },
    );
  }

  const payload = (await request.json()) as UpdateReportPayload;

  if (payload.status && !REPORT_STATUSES.includes(payload.status)) {
    return NextResponse.json(
      { message: "A valid status is required." },
      { status: 400 },
    );
  }

  if (!payload.status && !payload.dynamicFields) {
    return NextResponse.json(
      { message: "No updates provided." },
      { status: 400 },
    );
  }

  const reportsCollection = await getReportsCollection();
  const existing = await reportsCollection.findOne({ _id: new ObjectId(id) });

  if (!existing) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  if (payload.dynamicFields) {
    const distributionCollection = await getFormDistributionCollection();
    const activeRules = await distributionCollection
      .find({
        status: "active",
        projects: existing.projectName,
        allowEdits: false,
      })
      .toArray();
    if (activeRules.length > 0) {
      return NextResponse.json(
        { message: "Editing is not allowed for this submission." },
        { status: 403 },
      );
    }
  }

  const update: Record<string, unknown> = {};

  if (payload.status) {
    update.status = payload.status;
  }

  if (payload.dynamicFields) {
    update.dynamicFields = payload.dynamicFields;
    const fields: Record<string, string | string[]> = {};
    for (const field of payload.dynamicFields) {
      fields[field.label] = field.value;
    }
    update.fields = fields;
  }

  const result = await reportsCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return NextResponse.json({ report: toReportResponse(result!) });
}

export async function DELETE(_: Request, { params }: Params) {
  const { user: currentUser, error } = await requireActiveUser();

  if (error || !currentUser) {
    return NextResponse.json(
      { message: error!.message },
      { status: error!.status },
    );
  }

  if (currentUser.role !== "admin" && currentUser.role !== "facilitator") {
    return NextResponse.json(
      { message: "Only admins and facilitators can delete reports." },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid report id." },
      { status: 400 },
    );
  }

  const reportsCollection = await getReportsCollection();
  const result = await reportsCollection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Report deleted." });
}
