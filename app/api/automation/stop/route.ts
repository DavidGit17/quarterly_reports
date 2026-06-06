import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { getAgenda } from "@/server/agenda/config";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";

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
      automationJobId?: string;
    };

    const automationJobId = body.automationJobId?.trim();

    if (!automationJobId) {
      return NextResponse.json(
        { message: "Automation job ID is required." },
        { status: 400 },
      );
    }

    const agenda = await getAgenda();
    const cancelledCount = await agenda.cancel({ _id: automationJobId });

    if (cancelledCount === 0) {
      console.warn(
        `[AUTOMATION] No pending job found with ID: ${automationJobId}`,
      );
    } else {
      console.log(
        `[AUTOMATION] Cancelled ${cancelledCount} job(s) with ID: ${automationJobId}`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AUTOMATION] Stop error:", message);
    return NextResponse.json(
      { message: "Failed to stop automation." },
      { status: 500 },
    );
  }
}
