import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getUsersCollection, toSessionUser } from "@/lib/auth";
import { getMongoRouteErrorResponse } from "@/lib/mongodb";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;

    const username = payload.username?.trim() || "";
    const password = payload.password || "";

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({
      usernameLower: username.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const sessionToken = createSessionToken();
    const sessionExpiresAt = new Date(
      Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    );

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          sessionToken,
          sessionExpiresAt,
        },
      },
    );

    const response = NextResponse.json({
      message: "Login successful.",
      user: toSessionUser(user),
      role: user.role,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);

    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }

    return NextResponse.json(
      { message: "Unable to login right now. Please try again." },
      { status: 500 },
    );
  }
}
