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
      .find({
        role: { $in: cycle.targetRoles as Array<"coordinator" | "facilitator"> },
        status: "active",
        project: { $in: cycle.linkedProjects },
      })
      .toArray();

    const reportsCollection = await getReportsCollection();
    const submittedReports = await reportsCollection
      .find({ cycleId })
      .toArray();

    const submittedByUser = new Map<string, typeof submittedReports[0]>();
    for (const report of submittedReports) {
      const key = `${report.createdBy.toString()}|${report.projectName}`;
      if (!submittedByUser.has(key)) {
        submittedByUser.set(key, report);
      }
    }

    const db = await getDb();
    const projectsCollection = db.collection("projects");

    const projectSummary = cycle.linkedProjects.map(
      (projectName: string) => {
        const projectUsers = assignedUsers.filter(
          (u) =>
            u.project?.toLowerCase() === projectName.toLowerCase(),
        );
        const submitted = projectUsers.filter((u) =>
          submittedByUser.has(
            `${u._id.toString()}|${projectName}`,
          ),
        );
        const overdue = projectUsers.filter(
          (u) =>
            !submittedByUser.has(
              `${u._id.toString()}|${projectName}`,
            ) &&
            cycle.status === "active" &&
            new Date() > cycle.endDate,
        );

        return {
          projectName,
          totalUsers: projectUsers.length,
          submitted: submitted.length,
          notSubmitted: projectUsers.length - submitted.length,
          overdue: overdue.length,
          completionRate:
            projectUsers.length > 0
              ? Math.round(
                  (submitted.length / projectUsers.length) * 100,
                )
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
      perProject: projectSummary,
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
