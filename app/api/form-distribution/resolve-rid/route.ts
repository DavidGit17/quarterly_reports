import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { parseRecipientToken } from "@/server/form-distribution/execution-engine";
import { getSendHistoryCollection, toSendHistoryResponse } from "@/server/form-distribution/send-history";
import { ObjectId } from "mongodb";

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
    const rid = searchParams.get("rid")?.trim();

    if (!rid) {
      return NextResponse.json(
        { message: "rid query parameter is required." },
        { status: 400 },
      );
    }

    const parsed = parseRecipientToken(rid);
    if (!parsed) {
      return NextResponse.json(
        { message: "Invalid rid token." },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(parsed.userId) || !ObjectId.isValid(parsed.ruleId)) {
      return NextResponse.json(
        { message: "Malformed rid token." },
        { status: 400 },
      );
    }

    const collection = await getSendHistoryCollection();
    const record = await collection.findOne({
      ruleId: new ObjectId(parsed.ruleId),
      recipientUserId: new ObjectId(parsed.userId),
    });

    if (!record) {
      return NextResponse.json(
        { message: "No send history found for this token." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      record: toSendHistoryResponse(record),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: `Failed to resolve rid: ${message}` },
      { status: 500 },
    );
  }
}
