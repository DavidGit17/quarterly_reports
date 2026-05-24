import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  ADMIN_USERNAMES,
  MAX_ADMIN_ACCOUNTS,
  getUsersCollection,
} from "@/server/auth/auth";
import { COORDINATOR_PROJECT_OPTIONS } from "@/lib/shared/form-storage";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createAuthToken,
} from "@/server/auth/jwt";

type SignupPayload = {
  username?: string;
  email?: string;
  password?: string;
  role?: "admin" | "coordinator";
  project?: string;
};

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

const normalizeProjectName = (projectValue: string) => {
  const trimmed = projectValue.trim();
  const matchedProject = COORDINATOR_PROJECT_OPTIONS.find(
    (projectName) => projectName.toLowerCase() === trimmed.toLowerCase(),
  );

  return matchedProject || "";
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SignupPayload;

    const username = payload.username?.trim() || "";
    const email = payload.email?.trim() || "";
    const password = payload.password || "";
    const role = payload.role === "admin" ? "admin" : "coordinator";
    const project = normalizeProjectName(payload.project || "");

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email and password are required." },
        { status: 400 },
      );
    }

    if (!project) {
      return NextResponse.json(
        { message: "Project is required." },
        { status: 400 },
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { message: "Username must be at least 3 characters." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Email is invalid." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();

    if (role === "admin") {
      const adminCount = await usersCollection.countDocuments({
        role: "admin",
      });

      if (adminCount >= MAX_ADMIN_ACCOUNTS) {
        return NextResponse.json(
          { message: "Admin account limit exceeded" },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          message:
            "Admin accounts should be pre-created or manually inserted in DB.",
          allowedUsernames: ADMIN_USERNAMES,
        },
        { status: 403 },
      );
    }

    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();

    const existingUser = await usersCollection.findOne({
      $or: [{ usernameLower }, { emailLower }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username or email already exists." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await usersCollection.insertOne({
      username,
      usernameLower,
      email,
      emailLower,
      password: hashedPassword,
      role: "coordinator",
      project,
      profileImage: "",
      createdAt: new Date(),
    });

    const authToken = await createAuthToken(insertResult.insertedId.toString());

    const response = NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: insertResult.insertedId.toString(),
          username,
          email,
          role: "coordinator",
          project,
          profileImage: "",
        },
      },
      { status: 201 },
    );

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
      { message: "Unable to create account right now." },
      { status: 500 },
    );
  }
}
