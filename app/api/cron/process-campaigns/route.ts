import { NextResponse } from "next/server";
import { getEmailCampaignsCollection } from "@/server/email-campaigns/email-campaigns";
import { getReportingCyclesCollection } from "@/server/reporting-cycles/reporting-cycles";
import { getUsersCollection } from "@/server/auth/auth";
import { sendCampaignEmail } from "@/server/email/campaign-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validateCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const headerValue = request.headers.get("x-cron-secret");
  return headerValue === cronSecret;
}

export async function GET(request: Request) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return processCampaigns();
}

export async function POST(request: Request) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return processCampaigns();
}

async function processCampaigns() {
  try {
    const campaignsCollection = await getEmailCampaignsCollection();
    const now = new Date();

    const pendingCampaigns = await campaignsCollection
      .find({
        status: "pending",
        scheduledAt: { $lte: now },
      })
      .toArray();

    const results: Array<{ id: string; name: string; status: string }> = [];

    for (const campaign of pendingCampaigns) {
      try {
        await campaignsCollection.updateOne(
          { _id: campaign._id },
          { $set: { status: "sending" } },
        );

        const cyclesCollection = await getReportingCyclesCollection();
        const cycle = await cyclesCollection.findOne({
          _id: campaign.cycleId,
        });

        if (!cycle) {
          await campaignsCollection.updateOne(
            { _id: campaign._id },
            {
              $set: {
                status: "failed",
                errorMessage: "Linked cycle not found.",
              },
            },
          );
          results.push({
            id: campaign._id.toString(),
            name: campaign.name,
            status: "failed",
          });
          continue;
        }

        const usersCollection = await getUsersCollection();
        const userQuery: Record<string, unknown> = {
          role: { $in: campaign.targetRoles as Array<"coordinator" | "facilitator"> },
          status: "active",
        };
        if (campaign.projectName) {
          userQuery.project = campaign.projectName;
        }
        const targetUsers = await usersCollection
          .find(userQuery)
          .toArray();

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const formSlug = (campaign.projectName || "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const formUrl = `${appUrl}/form/${formSlug}`;

        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < targetUsers.length; i++) {
          const user = targetUsers[i];
          try {
            await sendCampaignEmail({
              to: user.email,
              username: user.username,
              cycleName: cycle.name,
              projectName: campaign.projectName,
              formUrl,
              campaignType: campaign.campaignType,
            });
            sentCount++;
          } catch {
            failedCount++;
          }

          if (i < targetUsers.length - 1) {
            await new Promise((r) => setTimeout(r, 250));
          }
        }

        const newStatus = failedCount > 0 && sentCount === 0 ? "failed" : "sent";

        await campaignsCollection.updateOne(
          { _id: campaign._id },
          {
            $set: {
              status: newStatus,
              sentAt: new Date(),
              recipientCount: sentCount,
              ...(failedCount > 0
                ? { errorMessage: `${failedCount} of ${targetUsers.length} emails failed.` }
                : {}),
            },
          },
        );

        results.push({
          id: campaign._id.toString(),
          name: campaign.name,
          status: newStatus,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";

        await campaignsCollection.updateOne(
          { _id: campaign._id },
          {
            $set: {
              status: "failed",
              errorMessage: message,
            },
          },
        );

        results.push({
          id: campaign._id.toString(),
          name: campaign.name,
          status: "failed",
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: `Campaign processing failed: ${message}` },
      { status: 500 },
    );
  }
}
