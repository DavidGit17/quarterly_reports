import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";
import { getUsersCollection } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { sendPasswordResetEmail } from "@/server/email/brevo-email";

const RESET_TOKEN_EXPIRY_HOURS = 1;

type ForgotPasswordPayload = {
  username?: string;
  email?: string;
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
    const email = payload.email?.trim().toLowerCase() || "";

    if (!username || !email) {
      return NextResponse.json(
        { message: "Username and email are required." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Invalid email address." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();

    const emailMatch = await usersCollection.findOne({
      emailLower: email,
    });

    if (emailMatch && emailMatch.usernameLower !== username.toLowerCase()) {
      return NextResponse.json(
        { message: "Invalid username." },
        { status: 400 },
      );
    }

    if (!emailMatch) {
      return NextResponse.json(
        { message: "Invalid email address." },
        { status: 400 },
      );
    }

    const user = emailMatch;

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store token in a dedicated collection
    const db = await getDb();
    const tokensCollection = db.collection("password_reset_tokens");
    await tokensCollection.insertOne({
      userId: user._id,
      email,
      tokenHash,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, token);
    } catch {
      // If email fails, delete the token and return error
      await tokensCollection.deleteOne({ tokenHash });
      return NextResponse.json(
        { message: "Failed to send reset email. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "If an account with that information exists, a reset link has been sent.",
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
      { message: "Unable to process request right now." },
      { status: 500 },
    );
  }
}
