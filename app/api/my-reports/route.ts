import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireActiveUser } from "@/server/auth/auth";
import { getReportsCollection, toReportResponse } from "@/server/reports/reports";

const MAX_MY_LIMIT = 100;
const DEFAULT_MY_LIMIT = 50;

export async function GET(request: Request) {
  const { user: currentUser, error } = await requireActiveUser();

  if (error || !currentUser) {
    return NextResponse.json(
      { message: error!.message },
      { status: error!.status },
    );
  }

  if (currentUser.role !== "coordinator" && currentUser.role !== "facilitator") {
    return NextResponse.json(
      { message: "Only coordinators and facilitators can access their reports." },
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(MAX_MY_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_MY_LIMIT), 10)));
  const search = searchParams.get("search")?.trim() || "";

  const query: Record<string, unknown> = {
    createdBy: new ObjectId(currentUser.id),
    projectName: assignedProject,
  };

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { quarter: { $regex: escaped, $options: "i" } },
    ];
  }

  const reportsCollection = await getReportsCollection();
  const skip = (page - 1) * limit;
  const [total, reports] = await Promise.all([
    reportsCollection.countDocuments(query),
    reportsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  return NextResponse.json({
    reports: reports.map(toReportResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
