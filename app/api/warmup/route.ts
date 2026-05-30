import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";
import { waitForIndexes } from "@/server/db/mongodb";

export async function GET() {
  const startedAt = Date.now();

  try {
    const db = await getDb();

    await db.command({ ping: 1 });
    const pingMs = Date.now() - startedAt;

    await waitForIndexes();
    const indexMs = Date.now() - startedAt - pingMs;

    return NextResponse.json({
      ok: true,
      pingMs,
      indexMs,
      totalMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: String(error) },
      { status: 500 },
    );
  }
}
