import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import { executeRuleNow } from "@/server/form-distribution/execution-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const body = (await request.json()) as { ruleId?: string };
    const ruleId = body.ruleId?.trim();

    if (!ruleId) {
      return NextResponse.json(
        { message: "ruleId is required." },
        { status: 400 },
      );
    }

    const result = await executeRuleNow(ruleId);

    if (result.status === "failed") {
      return NextResponse.json({ result }, { status: 500 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to execute rule." },
      { status: 500 },
    );
  }
}
