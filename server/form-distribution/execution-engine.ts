import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getUsersCollection, type UserRecord } from "@/server/auth/auth";
import { sendEmail } from "@/server/email/brevo-email";
import {
  getFormDistributionCollection,
  computeNextSendDate,
  type DistributionRuleRecord,
} from "@/server/form-distribution/form-distribution";
import {
  getSendHistoryCollection,
  type SendStatus,
} from "@/server/form-distribution/send-history";
import {
  getNotificationsCollection,
  type NotificationDocument,
} from "@/server/notifications/notifications";

// A rule locked longer than this is considered stale and will be recovered
const LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Max recipients to process per invocation (Netlify function timeout safety)
const CHUNK_SIZE = 25;

// Throttle delay between individual emails (ms) to stay within Brevo's ~300 req/min limit
const SEND_DELAY_MS = 250;

export type ProcessResult = {
  ruleId: string;
  ruleName: string;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  status: "sent" | "failed" | "skipped" | "locked";
  error?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getSigningKey(): string {
  const secret = process.env.AUTH_JWT_SECRET || "fallback-secret-do-not-use";
  return crypto.createHash("sha256").update(secret).digest("hex");
}

function signData(payload: string): string {
  return crypto
    .createHmac("sha256", getSigningKey())
    .update(payload)
    .digest("hex");
}

function generateRecipientToken(ruleId: string, userId: string): string {
  const payload = `${ruleId}:${userId}`;
  const sig = signData(payload);
  const token = `${payload}:${sig}`;
  return Buffer.from(token).toString("base64url");
}

export function parseRecipientToken(token: string): {
  ruleId: string;
  userId: string;
} | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [ruleId, userId, sig] = parts;
    const expectedSig = signData(`${ruleId}:${userId}`);
    if (sig !== expectedSig) return null;
    return { ruleId, userId };
  } catch {
    return null;
  }
}

function buildFormLink(projectName: string, role: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const rolePrefix = role === "facilitator" ? "/f/form" : "/form";
  return `${appUrl}${rolePrefix}/${toSlug(projectName)}`;
}

function buildEmailHtml(opts: {
  username: string;
  projectName: string;
  formLink: string;
  customMessage: string;
  invitationMessage: string;
  deadline?: string;
}): string {
  const deadlineHtml = opts.deadline
    ? `<p style="color: #dc2626; font-size: 14px; margin-bottom: 20px;">
         <strong>Deadline:</strong> ${opts.deadline}
       </p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Quarterly Reports</h1>
      </div>
      <div style="background: #fafafa; padding: 32px; border-radius: 0 0 8px 8px;">
        <p style="color: #1e293b; font-size: 16px; margin-bottom: 16px;">
          Hello <strong>${opts.username}</strong>,
        </p>
        <p style="color: #475569; font-size: 15px; margin-bottom: 20px; line-height: 1.6;">
          ${opts.customMessage || `A new form is ready for your project <strong>${opts.projectName}</strong>.`}
        </p>
        ${opts.invitationMessage ? `<p style="color: #475569; font-size: 14px; margin-bottom: 16px; font-style: italic;">"${opts.invitationMessage}"</p>` : ""}
        ${deadlineHtml}
        <div style="text-align: center; margin: 28px 0;">
          <a href="${opts.formLink}"
             style="background: #0f172a; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Open Form
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          This link is unique to your account. Do not share it with others.
        </p>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Recipient resolution
// ---------------------------------------------------------------------------

async function resolveRecipients(
  rule: DistributionRuleRecord,
): Promise<UserRecord[]> {
  console.log(
    `[EXECUTION ENGINE] resolveRecipients called for rule: "${rule.name}"`,
  );
  console.log(`[EXECUTION ENGINE]   - recipients type: ${rule.recipients}`);
  console.log(
    `[EXECUTION ENGINE]   - projects: ${JSON.stringify(rule.projects)}`,
  );
  console.log(
    `[EXECUTION ENGINE]   - specificUsers: ${JSON.stringify(rule.specificUsers)}`,
  );
  const usersCollection = await getUsersCollection();

  if (rule.recipients === "specific") {
    const specificIds = rule.specificUsers
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    const users = await usersCollection
      .find({
        _id: { $in: specificIds },
        status: "active",
      })
      .toArray();
    const filteredUsers = users.filter((u) =>
      rule.projects.some(
        (p) => p.toLowerCase() === (u.project || "").toLowerCase(),
      ),
    );
    console.log(
      `[EXECUTION ENGINE] resolveRecipients returning ${filteredUsers.length} users for rule "${rule.name}"`,
    );
    return filteredUsers;
  }

  const roles: Array<"coordinator" | "facilitator"> =
    rule.recipients === "coordinators"
      ? ["coordinator"]
      : rule.recipients === "facilitators"
        ? ["facilitator"]
        : ["coordinator", "facilitator"];

  const users = await usersCollection
    .find({
      role: { $in: roles },
      status: "active",
      project: {
        $in: rule.projects.map(
          (p) =>
            new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        ),
      },
    })
    .toArray();
  console.log(
    `[EXECUTION ENGINE] resolveRecipients found ${users.length} users before project filter`,
  );
  const filteredUsers = users;
  console.log(
    `[EXECUTION ENGINE] resolveRecipients returning ${filteredUsers.length} users for rule "${rule.name}"`,
  );
  return filteredUsers;
}

function toRecipientKey(ruleId: string, userId: string): string {
  return `${ruleId}:${userId}`;
}

// ---------------------------------------------------------------------------
// Lock management
// ---------------------------------------------------------------------------

async function acquireLock(
  ruleId: ObjectId,
  instanceId: string,
): Promise<boolean> {
  const collection = await getFormDistributionCollection();
  const now = new Date();
  const staleThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS);

  // Atomically acquire lock if:
  //   - processingStatus is not "processing" (fresh rule), OR
  //   - processingStartedAt < staleThreshold (stale lock recovery)
  const result = await collection.updateOne(
    {
      _id: ruleId,
      $or: [
        { processingStartedAt: { $exists: false } },
        { processingStartedAt: null },
        { processingStartedAt: { $lte: staleThreshold } },
      ],
    },
    {
      $set: {
        processingStartedAt: now,
        processingInstanceId: instanceId,
        processingCursor: 0,
      },
    },
  );

  return result.modifiedCount === 1;
}

async function releaseLock(
  ruleId: ObjectId,
  instanceId: string,
  cursor: number | null,
  totalRecipients: number,
): Promise<void> {
  const collection = await getFormDistributionCollection();

  const isComplete = cursor === null || cursor >= totalRecipients;

  if (isComplete) {
    const now = new Date();
    const rule = await collection.findOne({ _id: ruleId });
    const nextSendAt = rule
      ? computeNextSendDate(rule.scheduleType, rule.scheduleConfig)
      : null;

    await collection.updateOne(
      { _id: ruleId, processingInstanceId: instanceId },
      {
        $set: {
          lastSentAt: now,
          nextSendAt,
        },
        $unset: {
          processingStartedAt: "",
          processingInstanceId: "",
          processingCursor: "",
        },
      },
    );
  } else {
    // Partial progress — persist cursor for next invocation
    await collection.updateOne(
      { _id: ruleId, processingInstanceId: instanceId },
      {
        $set: {
          processingStartedAt: new Date(),
          processingCursor: cursor,
        },
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Send + log with duplicate detection
// ---------------------------------------------------------------------------

async function wasAlreadySent(
  ruleId: ObjectId,
  userId: ObjectId,
): Promise<boolean> {
  const collection = await getSendHistoryCollection();
  const existing = await collection.findOne(
    { ruleId, recipientUserId: userId },
    { projection: { _id: 1 } },
  );
  return existing !== null;
}

async function sendToRecipient(
  rule: DistributionRuleRecord,
  user: UserRecord,
  projectName: string,
  formLink: string,
): Promise<{ status: SendStatus; error?: string }> {
  try {
    await sendEmail({
      to: user.email,
      subject: rule.emailSubject || `Form: ${projectName}`,
      htmlContent: buildEmailHtml({
        username: user.username,
        projectName,
        formLink,
        customMessage: rule.customMessage,
        invitationMessage: rule.invitationMessage,
        deadline: rule.deadline,
      }),
    });
    return { status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: "failed", error: message };
  }
}

async function logSend(
  rule: DistributionRuleRecord,
  user: UserRecord,
  projectName: string,
  formLink: string,
  result: { status: SendStatus; error?: string },
): Promise<void> {
  const collection = await getSendHistoryCollection();
  await collection.insertOne({
    ruleId: rule._id,
    ruleName: rule.name,
    projectName,
    recipientEmail: user.email,
    recipientUserId: user._id,
    recipientRole: user.role,
    formLink,
    status: result.status,
    errorMessage: result.error,
    sentAt: new Date(),
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

/**
 * Process a rule in chunks. Returns the new cursor position.
 * A return of `null` means all recipients have been processed.
 */
async function processChunk(
  rule: DistributionRuleRecord,
  users: UserRecord[],
  cursor: number,
  skipDedupe = false,
): Promise<{
  newCursor: number | null;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
}> {
  const end = Math.min(cursor + CHUNK_SIZE, users.length);
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let i = cursor; i < end; i++) {
    const user = users[i];

    // Find the project for this user to generate the correct form link
    const projectName = rule.projects.find(
      (p) => (user.project || "").toLowerCase() === p.toLowerCase(),
    );
    if (!projectName) {
      skippedCount++;
      continue;
    }

    // Deduplicate: skip if already sent in a previous (timed-out) run
    // Unless skipDedupe is true (for manual Send Now)
    const alreadySent = skipDedupe ? false : await wasAlreadySent(rule._id, user._id);
    if (alreadySent) {
      skippedCount++;
      continue;
    }

    const baseLink = buildFormLink(projectName, user.role);
    const rid = generateRecipientToken(
      rule._id.toString(),
      user._id.toString(),
    );
    const formLink = `${baseLink}?rid=${rid}`;
    const result = await sendToRecipient(rule, user, projectName, formLink);
    await logSend(rule, user, projectName, formLink, result);

    if (result.status === "sent") {
      sentCount++;
      console.log(
        `[FORM DISTRIBUTION] Successfully sent form to ${user.email} for rule "${rule.name}"`,
      );
    } else {
      failedCount++;
      console.error(
        `[FORM DISTRIBUTION] Failed to send to ${user.email} for rule "${rule.name}": ${result.error || "Unknown error"}`,
      );
    }

    if (i < end - 1) {
      await delay(SEND_DELAY_MS);
    }
  }

  const newCursor = end >= users.length ? null : end;
  return { newCursor, sentCount, failedCount, skippedCount };
}

export async function processRule(
  rule: DistributionRuleRecord,
  skipDedupe = false,
): Promise<ProcessResult> {
  const instanceId = crypto.randomUUID();
  const collection = await getFormDistributionCollection();

  // Validate email configuration before attempting to process
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || "").trim();

  if (!apiKey || !senderEmail || senderEmail === "noreply@example.com") {
    const errorMsg =
      "[FORM DISTRIBUTION] Email service not properly configured. BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in environment variables.";
    console.error(errorMsg);
    return {
      ruleId: rule._id.toString(),
      ruleName: rule.name,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      status: "failed",
      error:
        "Email service configuration missing. Cannot send form distribution emails.",
    };
  }

  // 1. Acquire lock (will fail if another instance is actively processing)
  const locked = await acquireLock(rule._id, instanceId);
  if (!locked) {
    return {
      ruleId: rule._id.toString(),
      ruleName: rule.name,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      status: "locked",
      error: "Rule is currently being processed by another instance",
    };
  }

  try {
    // 2. Resolve recipients (full list — fresh each invocation)
    const users = await resolveRecipients(rule);

    if (users.length === 0) {
      // No recipients — nothing to do. Release lock immediately.
      await releaseLock(rule._id, instanceId, null, 0);
      return {
        ruleId: rule._id.toString(),
        ruleName: rule.name,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        status: "skipped",
        error: "No matching recipients found",
      };
    }

    // 3. Determine starting cursor (resume from where we left off)
    //    Re-read rule to get the latest cursor (may have been set by a previous chunk)
    const refreshed = await collection.findOne({ _id: rule._id });
    const cursor = refreshed?.processingCursor ?? 0;

    // 4. Process one chunk
    const { newCursor, sentCount, failedCount, skippedCount } =
      await processChunk(rule, users, cursor, skipDedupe);

    // 5. Release or update lock
    await releaseLock(rule._id, instanceId, newCursor, users.length);

    const isComplete = newCursor === null;

    return {
      ruleId: rule._id.toString(),
      ruleName: rule.name,
      sentCount,
      failedCount,
      skippedCount,
      status: isComplete ? "sent" : "skipped",
      error: isComplete
        ? undefined
        : `Partial: cursor at ${newCursor}/${users.length}. Next cron run will resume.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Try to release lock so the rule can be recovered by the next cron run
    try {
      await collection.updateOne(
        { _id: rule._id, processingInstanceId: instanceId },
        { $set: { processingStartedAt: new Date() } }, // refresh timestamp, not release
      );
    } catch {
      // Best-effort
    }

    return {
      ruleId: rule._id.toString(),
      ruleName: rule.name,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      status: "failed",
      error: message,
    };
  }
}

async function createNotification(
  type: NotificationDocument["type"],
  title: string,
  message: string,
  actionUrl?: string,
): Promise<void> {
  try {
    const collection = await getNotificationsCollection();
    await collection.insertOne({
      type,
      title,
      message,
      read: false,
      actionUrl: actionUrl || undefined,
      createdAt: new Date(),
    });
  } catch {
    // Best-effort — don't fail the send if notification logging fails
  }
}

export async function processDueRules(): Promise<{
  processed: number;
  results: ProcessResult[];
}> {
  const collection = await getFormDistributionCollection();
  const now = new Date();
  const staleThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS);

  // Find rules that are:
  //   - active AND due for sending (nextSendAt <= now), OR
  //   - active AND have a stale lock (processingStartedAt < staleThreshold)
  const dueRules = await collection
    .find({
      status: "active",
      $or: [
        { nextSendAt: { $lte: now } },
        {
          processingStartedAt: { $lte: staleThreshold },
        },
      ],
    })
    .toArray();

  const results: ProcessResult[] = [];

  for (const rule of dueRules) {
    const result = await processRule(rule);
    results.push(result);

    if (result.status === "sent" && result.sentCount > 0) {
      await createNotification(
        "form_sent",
        "Forms Sent",
        `${result.ruleName}: ${result.sentCount} form${result.sentCount === 1 ? "" : "s"} sent successfully.`,
        "/dashboard/form-distribution",
      );
    }

    if (result.status === "failed" || result.failedCount > 0) {
      await createNotification(
        "form_failed",
        "Form Send Failure",
        `${result.ruleName}: ${result.failedCount} email${result.failedCount === 1 ? "" : "s"} failed to send.${result.error ? ` ${result.error}` : ""}`,
        "/dashboard/form-distribution",
      );
    }
  }

  console.log(
    `[EXECUTION ENGINE] processDueRules completed. Processed: ${results.length}`,
  );
  return {
    processed: results.length,
    results,
  };
}

export async function executeRuleNow(ruleId: string): Promise<ProcessResult> {
  const collection = await getFormDistributionCollection();

  if (!ObjectId.isValid(ruleId)) {
    return {
      ruleId,
      ruleName: "",
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      status: "failed",
      error: "Invalid rule ID",
    };
  }

  const rule = await collection.findOne({ _id: new ObjectId(ruleId) });

  if (!rule) {
    return {
      ruleId,
      ruleName: "",
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      status: "failed",
      error: "Rule not found",
    };
  }

  // Send Now bypasses:
  // - stale-check in the lock (always processes)
  // - deduplication (allows resending)
  return processRule(rule, true /* skipDedupe */);
}
