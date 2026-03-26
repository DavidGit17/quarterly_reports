import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/auth";
import { getSessionTokenFromCookies, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST() {
  const sessionToken = await getSessionTokenFromCookies();

  if (sessionToken) {
    const usersCollection = await getUsersCollection();
    await usersCollection.updateMany(
      { sessionToken },
      { $unset: { sessionToken: "", sessionExpiresAt: "" } },
    );
  }

  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
