import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";
import { getUsersCollection } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import { checkRateLimit } from "@/server/auth/rate-limit";

type ResetPasswordPayload = {
  email?: string;
  token?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(request, "forgot-password");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const payload = (await request.json()) as ResetPasswordPayload;
    const email = payload.email?.trim().toLowerCase() || "";
    const token = payload.token?.trim() || "";
    const newPassword = payload.newPassword || "";

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { message: "Email, token, and new password are required." },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const tokensCollection = db.collection("password_reset_tokens");

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const tokenRecord = await tokensCollection.findOne({
      email,
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { message: "Invalid or expired reset token." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: tokenRecord.userId });

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    const isSameAsCurrentPassword = await bcrypt.compare(
      newPassword,
      user.password,
    );

    if (isSameAsCurrentPassword) {
      return NextResponse.json(
        { message: "New password must be different from the current password." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } },
    );

    await tokensCollection.updateOne(
      { _id: tokenRecord._id },
      { $set: { used: true } },
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
