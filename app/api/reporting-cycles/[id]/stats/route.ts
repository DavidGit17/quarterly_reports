import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin, getUsersCollection } from "@/server/auth/auth";
import { getDb, getMongoRouteErrorResponse } from "@/server/db/mongodb";
import { getReportingCyclesCollection } from "@/server/reporting-cycles/reporting-cycles";
import { getReportsCollection } from "@/server/reports/reports";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const { id } = await params;

    let cycleId: ObjectId;
    try {
      cycleId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { message: "Invalid cycle id." },
        { status: 400 },
      );
    }

    const cyclesCollection = await getReportingCyclesCollection();
    const cycle = await cyclesCollection.findOne({ _id: cycleId });

    if (!cycle) {
      return NextResponse.json(
        { message: "Reporting cycle not found." },
        { status: 404 },
      );
    }

    const usersCollection = await getUsersCollection();
    const assignedUsers = await usersCollection
      .find(
        {
          role: { $in: cycle.targetRoles as Array<"coordinator" | "facilitator"> },
          status: "active",
          project: { $in: cycle.linkedProjects },
        },
        { projection: { _id: 1, project: 1 } },
      )
      .toArray();

    const reportsCollection = await getReportsCollection();
    const submittedReports = await reportsCollection
      .find(
        { cycleId },
        { projection: { createdBy: 1, projectName: 1 } },
      )
      .toArray();

    // Build a Set of "userId|projectName" for O(1) lookup
    const submittedKeys = new Set<string>();
    for (const report of submittedReports) {
      submittedKeys.add(`${report.createdBy.toString()}|${report.projectName}`);
    }

    const now = new Date();
    const perProject = cycle.linkedProjects.map(
      (projectName: string) => {
        let totalUsers = 0;
        let submitted = 0;

        for (const user of assignedUsers) {
          if (user.project?.toLowerCase() !== projectName.toLowerCase()) continue;
          totalUsers++;
          const key = `${user._id.toString()}|${projectName}`;
          if (submittedKeys.has(key)) {
            submitted++;
          }
        }

        const notSubmitted = totalUsers - submitted;
        const overdue = cycle.status === "active" && now > cycle.endDate
          ? notSubmitted
          : 0;

        return {
          projectName,
          totalUsers,
          submitted,
          notSubmitted,
          overdue,
          completionRate:
            totalUsers > 0
              ? Math.round((submitted / totalUsers) * 100)
              : 0,
        };
      },
    );

    const totalAssigned = assignedUsers.length;
    const totalSubmitted = submittedReports.length;

    return NextResponse.json({
      cycle: {
        id: cycle._id.toString(),
        name: cycle.name,
        status: cycle.status,
        startDate: cycle.startDate.toISOString(),
        endDate: cycle.endDate.toISOString(),
      },
      summary: {
        totalAssigned,
        totalSubmitted,
        completionRate:
          totalAssigned > 0
            ? Math.round((totalSubmitted / totalAssigned) * 100)
            : 0,
      },
      perProject,
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
      { message: "Failed to load cycle stats." },
      { status: 500 },
    );
  }
}
