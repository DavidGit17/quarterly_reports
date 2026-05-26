import { NextResponse } from "next/server";
import { sendOTPEmail } from "@/server/email/brevo-email";
import { getDb } from "@/server/db/mongodb";
import { checkRateLimit } from "@/server/auth/rate-limit";

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP_EXPIRY_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 60;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

type SendOTPPayload = {
  email?: string;
  username?: string;
};

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(request, "send-otp");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many OTP requests. Please try again later." },
        { status: 429 },
      );
    }
    const payload = (await request.json()) as SendOTPPayload;
    const email = payload.email?.trim().toLowerCase() || "";
    const username = payload.username?.trim() || "User";

    console.log(`[OTP] Request received for email: ${email}`);

    if (!email) {
      console.log(`[OTP] Email validation failed: empty email`);
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 },
      );
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      console.log(`[OTP] Email validation failed: invalid format for ${email}`);
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const otpCollection = db.collection("otp_verification");

    // Check rate limiting - prevent spam
    const recentOTP = await otpCollection.findOne({
      email,
      createdAt: {
        $gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000),
      },
    });

    if (recentOTP) {
      console.log(`[OTP] Rate limit exceeded for ${email}. Cooldown active.`);
      return NextResponse.json(
        {
          message: `Please wait ${OTP_COOLDOWN_SECONDS} seconds before requesting a new OTP.`,
        },
        { status: 429 },
      );
    }

    // Check if user already exists
    const usersCollection = db.collection("users");
    const existingUser = await usersCollection.findOne({
      emailLower: email,
    });

    if (existingUser && existingUser.isVerified) {
      console.log(`[OTP] User already verified for ${email}`);
      return NextResponse.json(
        { message: "This email is already registered." },
        { status: 409 },
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    console.log(
      `[OTP] Generated OTP: ${otp} for ${email}, expires at ${expiresAt.toISOString()}`,
    );

    // Send OTP via email via Brevo API
    try {
      console.log(`[OTP] Sending email to ${email} via Brevo API...`);
      const emailSent = await sendOTPEmail(email, otp);

      if (!emailSent || !emailSent.success) {
        console.error(
          `[OTP] Email send failed - response indicates failure for ${email}`,
        );
        return NextResponse.json(
          {
            message:
              "Failed to send OTP email. Please check your email address and try again.",
          },
          { status: 500 },
        );
      }

      console.log(
        `[OTP] Email sent successfully to ${email}. Message ID: ${emailSent.messageId}`,
      );
    } catch (emailError: unknown) {
      const message = getErrorMessage(
        emailError,
        "Failed to send OTP email. Please try again.",
      );
      console.error(`[OTP] Email send error for ${email}:`, message);
      return NextResponse.json(
        {
          message,
        },
        { status: 500 },
      );
    }

    // Store OTP in database (only after successful email)
    await otpCollection.updateOne(
      { email },
      {
        $set: {
          email,
          username,
          otp,
          expiresAt,
          attempts: 0,
          maxAttempts: MAX_OTP_ATTEMPTS,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    console.log(`[OTP] Stored OTP in database for ${email}`);

    console.log(
      `[OTP] Request completed successfully for ${email}. OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    );

    return NextResponse.json({
      message: `OTP sent to ${email}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
      success: true,
    });
  } catch (error) {
    console.error("[OTP] Unexpected error:", error);
    return NextResponse.json(
      { message: "Failed to send OTP. Please try again." },
      { status: 500 },
    );
  }
}
