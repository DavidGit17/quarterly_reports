import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  getEmailCampaignsCollection,
  toCampaignResponse,
  type EmailCampaignDocument,
  type CampaignType,
  type CampaignStatus,
} from "@/server/email-campaigns/email-campaigns";
import { getReportingCyclesCollection } from "@/server/reporting-cycles/reporting-cycles";
import { getUsersCollection } from "@/server/auth/auth";
import { sendCampaignEmail } from "@/server/email/campaign-email";

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
    const cycleFilter = searchParams.get("cycleId")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const collection = await getEmailCampaignsCollection();
    const query: Record<string, unknown> = {};

    if (statusFilter) {
      query.status = statusFilter;
    }
    if (cycleFilter) {
      try {
        query.cycleId = new ObjectId(cycleFilter);
      } catch {
        return NextResponse.json(
          { message: "Invalid cycle id." },
          { status: 400 },
        );
      }
    }

    const [docs, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);
    const campaigns = docs.map(toCampaignResponse);

    return NextResponse.json({ campaigns, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to load campaigns." },
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

    const rateLimitResult = await checkRateLimit(request, "create-campaign");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as {
      name?: string;
      campaignType?: CampaignType;
      cycleId?: string;
      projectName?: string;
      targetRoles?: string[];
      scheduledAt?: string;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { message: "Campaign name is required." },
        { status: 400 },
      );
    }

    if (!body.cycleId) {
      return NextResponse.json(
        { message: "Cycle id is required." },
        { status: 400 },
      );
    }

    let cycleObjectId: ObjectId;
    try {
      cycleObjectId = new ObjectId(body.cycleId);
    } catch {
      return NextResponse.json(
        { message: "Invalid cycle id." },
        { status: 400 },
      );
    }

    if (!body.scheduledAt) {
      return NextResponse.json(
        { message: "Scheduled date is required." },
        { status: 400 },
      );
    }

    const scheduledAt = new Date(body.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { message: "Invalid scheduled date." },
        { status: 400 },
      );
    }

    const collection = await getEmailCampaignsCollection();
    const doc: EmailCampaignDocument = {
      name,
      campaignType: body.campaignType || "manual",
      cycleId: cycleObjectId,
      projectName: body.projectName?.trim() || "",
      targetRoles: body.targetRoles || [],
      scheduledAt,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    // Schedule campaign emails via Brevo (uses scheduledAt for future sends)
    if (created) {
      try {
        const cyclesCollection = await getReportingCyclesCollection();
        const cycle = await cyclesCollection.findOne({ _id: created.cycleId });
        const cycleName = cycle?.name || "Reporting Cycle";

        const usersCollection = await getUsersCollection();
        const userQuery: Record<string, unknown> = {
          role: { $in: created.targetRoles as Array<"coordinator" | "facilitator"> },
          status: "active",
        };
        if (created.projectName) {
          userQuery.project = created.projectName;
        }
        const targetUsers = await usersCollection.find(userQuery).toArray();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const formSlug = (created.projectName || "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const formUrl = `${appUrl}/form/${formSlug}`;

        const scheduledAtStr = created.scheduledAt > new Date()
          ? created.scheduledAt.toISOString()
          : undefined;

        let sentCount = 0;
        let failedCount = 0;

        // Send in batches of 5 to avoid overwhelming Brevo API rate limits
        const BATCH_SIZE = 5;
        for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
          const batch = targetUsers.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map((user) =>
              sendCampaignEmail({
                to: user.email,
                username: user.username,
                cycleName,
                projectName: created.projectName,
                formUrl,
                campaignType: created.campaignType,
                scheduledAt: scheduledAtStr,
              }),
            ),
          );
          for (const result of results) {
            if (result.status === "fulfilled") {
              sentCount++;
            } else {
              failedCount++;
            }
          }
        }

        const finalStatus = sentCount > 0 ? "sent" : "failed";
        await collection.updateOne(
          { _id: created._id },
          {
            $set: {
              status: finalStatus,
              sentAt: new Date(),
              recipientCount: sentCount,
              ...(failedCount > 0 ? { errorMessage: `${failedCount} of ${targetUsers.length} emails failed.` } : {}),
            },
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await collection.updateOne(
          { _id: created._id },
          { $set: { status: "failed", errorMessage: message } },
        );
      }
    }

    return NextResponse.json(
      {
        campaign: created ? toCampaignResponse(created) : null,
        message: "Campaign created.",
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
      { message: "Failed to create campaign." },
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

    const rateLimitResult = await checkRateLimit(request, "update-campaign");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      scheduledAt?: string;
      status?: CampaignStatus;
    };

    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json(
        { message: "Campaign id is required." },
        { status: 400 },
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { message: "Invalid campaign id." },
        { status: 400 },
      );
    }

    const setFields: Record<string, unknown> = {};
    if (fields.name !== undefined) {
      setFields.name = fields.name.trim();
    }
    if (fields.scheduledAt !== undefined) {
      const d = new Date(fields.scheduledAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "Invalid scheduled date." },
          { status: 400 },
        );
      }
      setFields.scheduledAt = d;
    }
    if (fields.status !== undefined) {
      setFields.status = fields.status;
    }

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json(
        { message: "No fields to update." },
        { status: 400 },
      );
    }

    const collection = await getEmailCampaignsCollection();
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: setFields },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { message: "Campaign not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      campaign: toCampaignResponse(result),
      message: "Campaign updated.",
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
      { message: "Failed to update campaign." },
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

    const rateLimitResult = await checkRateLimit(request, "delete-campaign");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as { id?: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Campaign id is required." },
        { status: 400 },
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { message: "Invalid campaign id." },
        { status: 400 },
      );
    }

    const collection = await getEmailCampaignsCollection();
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Campaign not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Campaign deleted." });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to delete campaign." },
      { status: 500 },
    );
  }
}
