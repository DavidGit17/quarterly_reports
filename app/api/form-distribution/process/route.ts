import { NextResponse } from "next/server";
import { processDueRules } from "@/server/form-distribution/execution-engine";

export const dynamic = "force-dynamic";
// Netlify: synchronous function timeout = 10s default, 26s max on Pro
// For large sends (100+ users), use external cron with retries instead
export const maxDuration = 120;

function validateCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // allow if not configured (dev)
  const headerValue = request.headers.get("x-cron-secret");
  return headerValue === cronSecret;
}

export async function GET(request: Request) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return processEndpoint();
}

export async function POST(request: Request) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return processEndpoint();
}

async function processEndpoint() {
  try {
    const result = await processDueRules();

    return NextResponse.json({
      processed: result.processed,
      results: result.results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: `Form distribution processing failed: ${message}` },
      { status: 500 },
    );
  }
}
