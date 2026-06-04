import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  return NextResponse.json({
    APP_BASE_URL: process.env.APP_BASE_URL || "NOT SET",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET"
  });
}
