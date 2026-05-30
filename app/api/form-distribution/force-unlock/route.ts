import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getFormDistributionCollection } from "@/server/form-distribution/form-distribution";
import { requireAdmin } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  try {
    const body = await request.json();
    const { ruleId } = body;
    if (!ruleId) {
      return NextResponse.json({ message: "ruleId required" }, { status: 400 });
    }
    const collection = await getFormDistributionCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(ruleId) },
      { $set: { processingStartedAt: null, processingInstanceId: null, processingCursor: null } }
    );
    return NextResponse.json({ 
      success: result.modifiedCount > 0,
      message: result.modifiedCount > 0 ? "Lock released" : "No lock to release"
    });
  } catch (err) {
    return NextResponse.json({ 
      message: err instanceof Error ? err.message : "Unknown error" 
    }, { status: 500 });
  }
}
