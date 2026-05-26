import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getUsersCollection } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import { checkRateLimit } from "@/server/auth/rate-limit";

type ForgotPasswordPayload = {
  username?: string;
  email?: string;
  newPassword?: string;
};

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(request, "forgot-password");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many password reset attempts. Please try again later." },
        { status: 429 },
      );
    }
    const payload = (await request.json()) as ForgotPasswordPayload;

    const username = payload.username?.trim() || "";
    const email = payload.email?.trim() || "";
    const newPassword = payload.newPassword || "";

    if (!username || !email || !newPassword) {
      return NextResponse.json(
        { message: "Username, email and new password are required." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Email is invalid." },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();

    const user = await usersCollection.findOne({
      usernameLower: username.toLowerCase(),
      emailLower: email.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { message: "No account found for the provided username and email." },
        { status: 404 },
      );
    }

    const isSameAsCurrentPassword = await bcrypt.compare(
      newPassword,
      user.password,
    );

    if (isSameAsCurrentPassword) {
      return NextResponse.json(
        {
          message: "Could not use old password. Please choose a new password.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );

    return NextResponse.json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);

    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }

    return NextResponse.json(
      { message: "Unable to reset password right now." },
      { status: 500 },
    );
  }
}
