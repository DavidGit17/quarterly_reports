import { NextResponse } from "next/server";
import { getFormDistributionCollection } from "@/server/form-distribution/form-distribution";
import { getUsersCollection } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

function validateCronRequest(request: Request): { valid: boolean; reason?: string } {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return { valid: true };
  const headerValue = request.headers.get("x-cron-secret") || request.headers.get("x_cron_secret");
  if (headerValue === cronSecret) return { valid: true };
  return { valid: false, reason: "Invalid cron secret" };
}

export async function GET(request: Request) {
  const validation = validateCronRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const rulesCollection = await getFormDistributionCollection();
    const usersCollection = await getUsersCollection();
    const now = new Date();

    const allRules = await rulesCollection.find().toArray();
    
    const statusCounts = {
      active: allRules.filter(r => r.status === 'active').length,
      paused: allRules.filter(r => r.status === 'paused').length,
      disabled: allRules.filter(r => r.status === 'disabled').length,
    };

    const dueRules = await rulesCollection
      .find({
        status: "active",
        nextSendAt: { $lte: now },
      })
      .toArray();

    const recipientCounts = {
      coordinators: allRules.filter(r => r.recipients === 'coordinators').length,
      facilitators: allRules.filter(r => r.recipients === 'facilitators').length,
      both: allRules.filter(r => r.recipients === 'both').length,
      specific: allRules.filter(r => r.recipients === 'specific').length,
    };

    const coordinatorCount = await usersCollection.countDocuments({ role: 'coordinator', status: 'active' });
    const facilitatorCount = await usersCollection.countDocuments({ role: 'facilitator', status: 'active' });

    const apiKey = (process.env.BREVO_API_KEY || "").trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || "").trim();
    const emailConfigValid = apiKey && senderEmail && senderEmail !== "noreply@example.com";

    return NextResponse.json({
      timestamp: now.toISOString(),
      emailConfig: {
        apiKeySet: Boolean(apiKey),
        senderEmailSet: Boolean(senderEmail),
        senderEmailValue: senderEmail || "NOT SET",
        isValid: emailConfigValid,
      },
      users: {
        coordinators: coordinatorCount,
        facilitators: facilitatorCount,
      },
      rules: {
        total: allRules.length,
        byStatus: statusCounts,
        byRecipients: recipientCounts,
        dueNow: dueRules.length,
      },
      dueRules: dueRules.map(r => ({
        id: r._id.toString(),
        name: r.name,
        status: r.status,
        recipients: r.recipients,
        projects: r.projects,
        nextSendAt: r.nextSendAt?.toISOString() || "null",
        lastSentAt: r.lastSentAt?.toISOString() || "never",
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ message: `Debug failed: ${message}` }, { status: 500 });
  }
}
