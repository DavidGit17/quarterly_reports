import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getReportsCollection, toReportResponse } from "@/lib/reports";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid report id." },
      { status: 400 },
    );
  }

  const reportsCollection = await getReportsCollection();
  const report = await reportsCollection.findOne({ _id: new ObjectId(id) });

  if (!report) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  const isAdmin = currentUser.role === "admin";
  const isOwner = report.createdBy.toString() === currentUser.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { message: "You do not have access to this report." },
      { status: 403 },
    );
  }

  return NextResponse.json({ report: toReportResponse(report) });
}
