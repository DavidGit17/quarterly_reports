import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createAuthToken,
  verifyAuthToken,
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
} from "@/server/auth/jwt";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: "No session found." },
        { status: 401 },
      );
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      cookieStore.delete(AUTH_COOKIE_NAME);
      return NextResponse.json(
        { message: "Session expired. Please log in again." },
        { status: 401 },
      );
    }

    const newToken = await createAuthToken(payload.sub);

    cookieStore.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ message: "Session refreshed." });
  } catch {
    return NextResponse.json(
      { message: "Failed to refresh session." },
      { status: 500 },
    );
  }
}
