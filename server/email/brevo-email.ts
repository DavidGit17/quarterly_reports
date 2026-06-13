/**
 * TypeScript wrapper for email utilities
 * Provides type-safe access to Brevo email functionality
 */

import axios from "axios";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface BrevoResponse {
  messageId?: string;
  success?: boolean;
  email?: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  scheduledAt?: string;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown email service error";

/**
 * Validate Brevo configuration
 */
const getBrevoApiKey = () => (process.env.BREVO_API_KEY || "").trim();
const getSenderEmail = () =>
  process.env.BREVO_SENDER_EMAIL?.trim() || "noreply@example.com";

const validateConfig = (): void => {
  const apiKey = getBrevoApiKey();
  const senderEmail = getSenderEmail();
  if (!apiKey || !senderEmail || senderEmail === "noreply@example.com") {
    const errorMsg =
      "[BREVO] Email service not properly configured. BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in environment variables.";
    console.error(errorMsg);
    throw new Error("Email service configuration missing");
  }
};

/**
 * Get Brevo API headers
 */
const getHeaders = () => ({
  "api-key": getBrevoApiKey(),
  "Content-Type": "application/json",
});

/**
 * Send email via Brevo API
 */
const sendEmail = async (options: SendEmailOptions): Promise<BrevoResponse> => {
  validateConfig();

  try {
    const payload: Record<string, unknown> = {
      sender: {
        email: getSenderEmail(),
        name: "Quarterly Reports",
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.htmlContent,
    };
    if (options.scheduledAt) {
      payload.scheduledAt = options.scheduledAt;
    }

    console.log(`[BREVO] Sending email to: ${options.to}`);
    console.log(`[BREVO] Subject: ${options.subject}`);
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: getHeaders(),
    });

    console.log(
      `[BREVO] Email sent successfully to ${options.to}. Message ID: ${response.data.messageId}`,
    );
    return {
      success: true,
      messageId: response.data.messageId,
      email: options.to,
    };
  } catch (error: unknown) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    const responseData = axios.isAxiosError(error)
      ? error.response?.data
      : undefined;
    const message = getErrorMessage(error);

    console.error(
      `[BREVO] Error sending email to ${options.to}:`,
      responseData || message,
    );

    if (status === 401) {
      const brevoMsg = axios.isAxiosError(error)
        ? JSON.stringify(error.response?.data)
        : "";
      console.error(`[BREVO] 401 response data: ${brevoMsg}`);
      throw new Error("Invalid Brevo API key");
    }

    if (status === 400) {
      const invalidEmailMessage =
        typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData
          ? String(responseData.message)
          : message;
      throw new Error(`Invalid email address: ${invalidEmailMessage}`);
    }

    throw new Error(`Failed to send email: ${message}`);
  }
};

/**
 * Send a raw email (used by automations and other systems)
 */
export { sendEmail };

/**
 * Send OTP email
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
): Promise<BrevoResponse> => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Verify Your Email</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          Thank you for signing up! Use the code below to verify your email address.
        </p>
        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
          <p style="color: #667eea; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 4px; font-family: 'Courier New', monospace;">
            ${otp}
          </p>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 20px;">
          This code will expire in <strong>15 minutes</strong>. Do not share this code with anyone.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Your OTP Verification Code",
    htmlContent,
  });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  username: string,
): Promise<BrevoResponse> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome, ${username}!</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          Your account has been successfully created. You can now log in and start managing your quarterly reports.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/unified-auth-page" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to Quarterly Reports!",
    htmlContent,
  });
};

/**
 * Send project form URL email to multiple recipients
 */
export const sendProjectFormEmail = async (
  emails: string[],
  formUrl: string,
): Promise<{ sent: number; failed: number }> => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1768DB; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Quarterly Report Form</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          A new quarterly report form is ready for your submission. Please use the link below to access the form and submit your report before the deadline.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${formUrl}"
             style="background: #1768DB; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
            Open Form
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 20px;">
          If the button above does not work, copy and paste the following URL into your browser:
        </p>
        <p style="color: #1768DB; font-size: 13px; word-break: break-all; background: white; padding: 12px; border-radius: 6px; border: 1px solid #DFE1E6;">
          ${formUrl}
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          This is an automated message from Quarterly Reports Management System. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  `;

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await sendEmail({
        to: email,
        subject: "Quarterly Report Form - Action Required",
        htmlContent,
      });
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[BREVO] Failed to send project form email to ${email}: ${message}`);
      failed++;
    }
  }

  return { sent, failed };
};
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
): Promise<BrevoResponse> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Reset Your Password</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/reset-password?token=${resetToken}" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 20px;">
          This link will expire in <strong>1 hour</strong>.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Password Reset Request",
    htmlContent,
  });
};
