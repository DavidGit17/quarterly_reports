import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getUsersCollection, toSessionUser } from "@/lib/auth";
import { getMongoRouteErrorResponse } from "@/lib/mongodb";

type SignupPayload = {
  username?: string;
  email?: string;
  password?: string;
};

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SignupPayload;

    const username = payload.username?.trim() || "";
    const email = payload.email?.trim() || "";
    const password = payload.password || "";

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email and password are required." },
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
      createdAt: new Date(),
    });

    const createdUser = await usersCollection.findOne({
      _id: insertResult.insertedId,
    });

    if (!createdUser) {
      return NextResponse.json(
        { message: "Failed to create account." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: toSessionUser(createdUser),
      },
      { status: 201 },
    );
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
