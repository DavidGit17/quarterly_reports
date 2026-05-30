import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  getSendHistoryCollection,
  toSendHistoryResponse,
} from "@/server/form-distribution/send-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const collection = await getSendHistoryCollection();

    const filter: Record<string, unknown> = {};
    if (ruleId) filter.ruleId = ruleId;
    if (status) filter.status = status;

    const [docs, total] = await Promise.all([
      collection.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      items: docs.map(toSendHistoryResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
      { message: "Failed to load send history." },
      { status: 500 },
    );
  }
}
