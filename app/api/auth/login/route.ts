import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getUsersCollection, toSessionUser } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createAuthToken,
} from "@/server/auth/jwt";
import { checkRateLimit } from "@/server/auth/rate-limit";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(request, "login");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many login attempts. Please try again later." },
        { status: 429 },
      );
    }

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

    if (user.status === "inactive") {
      return NextResponse.json(
        {
          message:
            "Your account is currently inactive. Please contact administrator.",
        },
        { status: 403 },
      );
    }

    const authToken = await createAuthToken(user._id.toString());

    const response = NextResponse.json({
      message: "Login successful.",
      user: toSessionUser(user),
      role: user.role,
      project: user.project,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: authToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_MAX_AGE_SECONDS,
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
