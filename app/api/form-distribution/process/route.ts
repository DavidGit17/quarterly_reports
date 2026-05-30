import { NextResponse } from "next/server";
import { processDueRules } from "@/server/form-distribution/execution-engine";

export const dynamic = "force-dynamic";
// Netlify: synchronous function timeout = 10s default, 26s max on Pro
// For large sends (100+ users), use external cron with retries instead
export const maxDuration = 120;

function validateCronRequest(request: Request): { valid: boolean; reason?: string } {
  const cronSecret = process.env.CRON_SECRET;
  console.log(`[CRON VALIDATE] CRON_SECRET is ${cronSecret ? "SET" : "NOT SET"}`);
  if (!cronSecret) {
    console.log(`[CRON VALIDATE] No CRON_SECRET configured, allowing request`);
    return { valid: true };
  }
  const headerValue = request.headers.get("x-cron-secret") || request.headers.get("x_cron_secret");
  console.log(`[CRON VALIDATE] Header x-cron-secret: "${headerValue ? "PRESENT" : "MISSING"}"`);
  console.log(`[CRON VALIDATE] Expected secret: "${cronSecret}"`);
  if (headerValue === cronSecret) {
    console.log(`[CRON VALIDATE] Secret match: SUCCESS`);
    return { valid: true };
  }
  console.log(`[CRON VALIDATE] Secret match: FAILED`);
  return { valid: false, reason: "Invalid cron secret" };
}

export async function GET(request: Request) {
  console.log(`[FORM DISTRIBUTION CRON] Received ${request.method} request`);
  const validation = validateCronRequest(request);
  if (!validation.valid) {
    console.log(`[FORM DISTRIBUTION CRON] Unauthorized: ${validation.reason}`);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return processEndpoint();
}

export async function POST(request: Request) {
  console.log(`[FORM DISTRIBUTION CRON] Received ${request.method} request`);
  const validation = validateCronRequest(request);
  if (!validation.valid) {
    console.log(`[FORM DISTRIBUTION CRON] Unauthorized: ${validation.reason}`);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return processEndpoint();
}

async function processEndpoint() {
  console.log(`[FORM DISTRIBUTION CRON] Starting processEndpoint`);
  try {
    console.log(`[FORM DISTRIBUTION CRON] Calling processDueRules...`);
    const result = await processDueRules();
    console.log(`[FORM DISTRIBUTION CRON] processDueRules completed:`, JSON.stringify(result, null, 2));
    return NextResponse.json({
      processed: result.processed,
      results: result.results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[FORM DISTRIBUTION CRON] Error:`, message, err);
    return NextResponse.json(
      { message: `Form distribution processing failed: ${message}` },
      { status: 500 },
    );
  }
}
