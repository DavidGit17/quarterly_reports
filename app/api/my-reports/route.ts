import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/auth";
import { getReportsCollection, toReportResponse } from "@/server/reports/reports";

export async function GET() {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "coordinator") {
    return NextResponse.json(
      { message: "Only coordinators can access their reports." },
      { status: 403 },
    );
  }

  const assignedProject = currentUser.project?.trim();

  if (!assignedProject) {
    return NextResponse.json(
      { message: "Project is not assigned to this coordinator." },
      { status: 403 },
    );
  }

  const reportsCollection = await getReportsCollection();
  const reports = await reportsCollection
    .find({
      createdBy: new ObjectId(currentUser.id),
      projectName: assignedProject,
    })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ reports: reports.map(toReportResponse) });
}
