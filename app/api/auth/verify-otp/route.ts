import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";
import { COORDINATOR_PROJECT_OPTIONS } from "@/lib/shared/form-storage";
import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  createAuthToken,
} from "@/server/auth/jwt";
import { sendWelcomeEmail } from "@/server/email/brevo-email";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { cookies } from "next/headers";

const MAX_OTP_ATTEMPTS = 5;

type VerifyOTPPayload = {
  email?: string;
  otp?: string;
  username?: string;
  password?: string;
  role?: "admin" | "coordinator" | "facilitator";
  project?: string;
};

const normalizeProjectName = (projectValue: string) => {
  const trimmed = projectValue.trim();
  const matchedProject = COORDINATOR_PROJECT_OPTIONS.find(
    (projectName) => projectName.toLowerCase() === trimmed.toLowerCase(),
  );
  return matchedProject || "";
};

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(request, "verify-otp");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many verification attempts. Please try again later." },
        { status: 429 },
      );
    }
    const payload = (await request.json()) as VerifyOTPPayload;
    const email = payload.email?.trim().toLowerCase() || "";
    const otp = payload.otp?.trim() || "";
    const username = payload.username?.trim() || "";
    const password = payload.password || "";
    const role = payload.role === "admin" ? "admin" : (payload.role === "facilitator" ? "facilitator" : "coordinator");
    const project = normalizeProjectName(payload.project || "");

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const otpCollection = db.collection("otp_verification");
    const usersCollection = db.collection("users");

    // Find OTP record
    const otpRecord = await otpCollection.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json(
        { message: "OTP not found. Please request a new one." },
        { status: 400 },
      );
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await otpCollection.deleteOne({ email });
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Check attempt count
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await otpCollection.deleteOne({ email });
      return NextResponse.json(
        {
          message: "Too many failed attempts. Please request a new OTP.",
        },
        { status: 429 },
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpCollection.updateOne({ email }, { $inc: { attempts: 1 } });
      return NextResponse.json(
        { message: "Invalid OTP. Please try again." },
        { status: 400 },
      );
    }

    // OTP is valid - proceed with signup if credentials provided
    if (username && password) {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({
        $or: [{ usernameLower: username.toLowerCase() }, { emailLower: email }],
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Username or email already registered." },
          { status: 409 },
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const now = new Date();
      const result = await usersCollection.insertOne({
        username,
        usernameLower: username.toLowerCase(),
        email,
        emailLower: email,
        password: passwordHash,
        role,
        status: "active",
        ...(role !== "admin" && { project }),
        isVerified: true,
        verifiedAt: now,
        createdAt: now,
      });

      const userId = result.insertedId.toString();

      // Create JWT token
      const token = await createAuthToken(userId);

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: AUTH_MAX_AGE_SECONDS,
      });

      // Send welcome email (don't fail if email fails)
      try {
        await sendWelcomeEmail(email, username);
      } catch (emailError: unknown) {
        console.warn("Failed to send welcome email:", emailError);
        // Don't return error, as account is already created
      }

      // Delete OTP record
      await otpCollection.deleteOne({ email });

      return NextResponse.json({
        message: "Account verified and created successfully.",
        success: true,
        user: {
          id: userId,
          role,
          project: role !== "admin" ? project : undefined,
        },
      });
    }

    // If only verifying email (not creating account)
    await otpCollection.deleteOne({ email });

    return NextResponse.json({
      message: "Email verified successfully.",
      success: true,
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { message: "Failed to verify OTP. Please try again." },
      { status: 500 },
    );
  }
}
