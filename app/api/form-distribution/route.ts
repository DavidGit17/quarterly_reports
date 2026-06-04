import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  getFormDistributionCollection,
  computeNextSendDate,
  toRuleResponse,
  type DistributionRuleDocument,
  type ScheduleType,
  type ScheduleConfig,
  type RuleStatus,
} from "@/server/form-distribution/form-distribution";
import { scheduleRuleEmails } from "@/server/form-distribution/execution-engine";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const collection = await getFormDistributionCollection();
    const docs = await collection
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    const rules = docs.map(toRuleResponse);

    return NextResponse.json({ rules });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to load distribution rules." },
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

    const body = (await request.json()) as {
      name?: string;
      projects?: string[];
      forms?: string[];
      recipients?: string;
      specificUsers?: string[];
      scheduleType?: ScheduleType;
      scheduleConfig?: ScheduleConfig;
      emailSubject?: string;
      customMessage?: string;
      invitationMessage?: string;
      allowEdits?: boolean;
      deadline?: string;
      expirationDate?: string;
      status?: RuleStatus;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { message: "Rule name is required." },
        { status: 400 },
      );
    }

    if (!body.projects || body.projects.length === 0) {
      return NextResponse.json(
        { message: "Select at least one project." },
        { status: 400 },
      );
    }

    if (!body.recipients) {
      return NextResponse.json(
        { message: "Select at least one recipient group." },
        { status: 400 },
      );
    }

    if (!body.scheduleType) {
      return NextResponse.json(
        { message: "Schedule type is required." },
        { status: 400 },
      );
    }

    const scheduleConfig: ScheduleConfig = body.scheduleConfig || {};
    if (body.scheduleType === "custom" && !scheduleConfig.date) {
      return NextResponse.json(
        { message: "Custom date is required for custom schedule." },
        { status: 400 },
      );
    }

    const nextSendAt = computeNextSendDate(body.scheduleType, scheduleConfig);

    const doc: DistributionRuleDocument = {
      name,
      projects: body.projects,
      forms: body.forms || [],
      recipients: body.recipients as DistributionRuleDocument["recipients"],
      specificUsers: body.specificUsers || [],
      scheduleType: body.scheduleType,
      scheduleConfig,
      emailSubject: body.emailSubject?.trim() || "",
      customMessage: body.customMessage?.trim() || "",
      invitationMessage: body.invitationMessage?.trim() || "",
      allowEdits: body.allowEdits ?? true,
      deadline: body.deadline || "",
      expirationDate: body.expirationDate || "",
      status: body.status || "active",
      lastSentAt: null,
      nextSendAt,
      createdAt: new Date(),
    };

    const collection = await getFormDistributionCollection();
    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    if (created && doc.status === "active" && doc.nextSendAt) {
      const scheduleResult = await scheduleRuleEmails(created);
      console.log(
        `[FORM DISTRIBUTION] Pre-scheduled ${scheduleResult.scheduled} emails for rule "${created.name}" via Brevo.`,
      );
    }

    return NextResponse.json(
      {
        rule: created ? toRuleResponse(created) : null,
        message: "Distribution rule created.",
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
      { message: "Failed to create distribution rule." },
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

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      projects?: string[];
      forms?: string[];
      recipients?: string;
      specificUsers?: string[];
      scheduleType?: ScheduleType;
      scheduleConfig?: ScheduleConfig;
      emailSubject?: string;
      customMessage?: string;
      invitationMessage?: string;
      allowEdits?: boolean;
      deadline?: string;
      expirationDate?: string;
      status?: RuleStatus;
    };

    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json(
        { message: "Rule id is required." },
        { status: 400 },
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { message: "Invalid rule id." },
        { status: 400 },
      );
    }

    const setFields: Record<string, unknown> = {};
    if (fields.name !== undefined) setFields.name = fields.name.trim();
    if (fields.projects !== undefined) setFields.projects = fields.projects;
    if (fields.forms !== undefined) setFields.forms = fields.forms;
    if (fields.recipients !== undefined) setFields.recipients = fields.recipients;
    if (fields.specificUsers !== undefined) setFields.specificUsers = fields.specificUsers;
    if (fields.scheduleType !== undefined) setFields.scheduleType = fields.scheduleType;
    if (fields.scheduleConfig !== undefined) setFields.scheduleConfig = fields.scheduleConfig;
    if (fields.emailSubject !== undefined) setFields.emailSubject = fields.emailSubject?.trim();
    if (fields.customMessage !== undefined) setFields.customMessage = fields.customMessage?.trim();
    if (fields.invitationMessage !== undefined) setFields.invitationMessage = fields.invitationMessage?.trim();
    if (fields.allowEdits !== undefined) setFields.allowEdits = fields.allowEdits;
    if (fields.deadline !== undefined) setFields.deadline = fields.deadline;
    if (fields.expirationDate !== undefined) setFields.expirationDate = fields.expirationDate;
    if (fields.status !== undefined) setFields.status = fields.status;

    if (fields.scheduleType && fields.scheduleConfig) {
      const nextSendAt = computeNextSendDate(fields.scheduleType, fields.scheduleConfig);
      setFields.nextSendAt = nextSendAt;
    }

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json(
        { message: "No fields to update." },
        { status: 400 },
      );
    }

    const collection = await getFormDistributionCollection();
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: setFields },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { message: "Distribution rule not found." },
        { status: 404 },
      );
    }

    const updatedStatus = fields.status ?? result.status;
    if (updatedStatus === "active") {
      await scheduleRuleEmails(result);
    }

    return NextResponse.json({
      rule: toRuleResponse(result),
      message: "Distribution rule updated.",
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
      { message: "Failed to update distribution rule." },
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

    const body = (await request.json()) as { id?: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Rule id is required." },
        { status: 400 },
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { message: "Invalid rule id." },
        { status: 400 },
      );
    }

    const collection = await getFormDistributionCollection();
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Distribution rule not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Distribution rule deleted." });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to delete distribution rule." },
      { status: 500 },
    );
  }
}
