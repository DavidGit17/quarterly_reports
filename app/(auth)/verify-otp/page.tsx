"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyOTPResponse = {
  message?: string;
  success?: boolean;
  verified?: boolean;
  user?: {
    id: string;
    role: "admin" | "coordinator";
    project?: string;
  };
};

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const username = searchParams.get("username") || "";
  const password = typeof window !== "undefined" ? (sessionStorage.getItem("signup_password") || "") : "";
  const role =
    (searchParams.get("role") as "admin" | "coordinator") || "coordinator";
  const project = searchParams.get("project") || "";

  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!email) {
      router.push("/signup");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCountdown > 0) {
      countdownRef.current = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [resendCountdown]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setErrorMessage("Please enter a valid 6-digit OTP.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          username: username || undefined,
          password: password || undefined,
          role: role || undefined,
          project: project || undefined,
        }),
      });

      const data = (await response.json()) as VerifyOTPResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to verify OTP.");
        return;
      }

      if (data.user?.role === "admin") {
        router.push("/dashboard");
      } else if (data.user?.project) {
        const projectSlug = data.user.project
          .toLowerCase()
          .replace(/\s+/g, "-");
        router.push(`/form/${projectSlug}`);
      } else {
        router.push("/");
      }
      sessionStorage.removeItem("signup_password");
    } catch {
      setErrorMessage("Unable to verify OTP right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setErrorMessage("");
    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to resend OTP.");
        return;
      }

      setResendCountdown(60);
      setOtp("");
    } catch {
      setErrorMessage("Unable to resend OTP right now. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Verify Email</h1>
          <p className="text-muted-foreground mb-8">
            Enter the verification code sent to{" "}
            <span className="font-semibold">{email}</span>
          </p>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOTPChange}
                placeholder="000000"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white text-center text-2xl tracking-widest font-mono"
                required
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                6-digit code (valid for 15 minutes)
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={resendLoading || resendCountdown > 0}
              className="w-full text-secondary hover:underline font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {resendCountdown > 0
                ? `Resend code in ${resendCountdown}s`
                : "Resend Code"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/signup"
              className="text-secondary hover:underline text-sm"
            >
              Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md p-8">
            <div className="h-8 w-48 bg-slate-200 rounded mx-auto" />
            <div className="h-4 w-64 bg-slate-200 rounded mx-auto" />
            <div className="h-12 w-full bg-slate-200 rounded" />
            <div className="h-12 w-full bg-slate-200 rounded" />
          </div>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
