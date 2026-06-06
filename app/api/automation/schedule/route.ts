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
      projectId?: string;
      formUrl?: string;
      scheduleDate?: string;
    };

    const projectId = body.projectId?.trim();
    const formUrl = body.formUrl?.trim();
    const scheduleDate = body.scheduleDate?.trim();

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required." },
        { status: 400 },
      );
    }

    if (!formUrl) {
      return NextResponse.json(
        { message: "Form URL is required." },
        { status: 400 },
      );
    }

    if (!scheduleDate) {
      return NextResponse.json(
        { message: "Schedule date is required." },
        { status: 400 },
      );
    }

    const scheduledAt = new Date(scheduleDate);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { message: "Invalid schedule date format." },
        { status: 400 },
      );
    }

    const agenda = await getAgenda();
    const job = await agenda.schedule(
      scheduledAt,
      "send-project-form-links",
      { projectId, formUrl },
    );

    const jobId = String(job.attrs._id);

    console.log(
      `[AUTOMATION] Scheduled send-project-form-links for project ${projectId} at ${scheduledAt.toISOString()}. Job ID: ${jobId}`,
    );

    return NextResponse.json(
      { success: true, jobId },
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
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AUTOMATION] Schedule error:", message);
    return NextResponse.json(
      { message: "Failed to schedule automation." },
      { status: 500 },
    );
  }
}
