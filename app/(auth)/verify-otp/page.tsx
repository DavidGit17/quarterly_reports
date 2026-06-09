"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";

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
  const [successMessage, setSuccessMessage] = useState("");
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!email) {
      router.push("/auth");
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

      sessionStorage.removeItem("signup_password");
      if (data.user?.role === "admin") {
        router.replace("/dashboard");
      } else if (data.user?.role === "coordinator") {
        router.replace("/");
      } else {
        router.replace("/f");
      }
      setSuccessMessage("Getting things ready for you...");
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">

      <div className="w-full max-w-[380px] mx-auto sm:max-w-[440px] sm:bg-white sm:rounded-2xl sm:border sm:border-[#DFE1E6] sm:shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-6 sm:p-10 relative flex flex-col animate-in fade-in zoom-in-95 duration-500">

        <div className="flex flex-col items-center mb-10">
          <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-8 w-auto max-w-full" fetchPriority="high" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">Verify Email</h1>
          <p className="text-sm text-[#5E6C84] mt-2 max-w-[320px] mx-auto leading-relaxed">
            Enter the verification code sent to <br />
            <span className="font-semibold text-[#172B4D]">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-5">
          <div>
            <Label
              htmlFor="otp"
              className="text-sm font-medium text-[#172B4D] mb-1.5 block"
            >
              Verification Code
            </Label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={handleOTPChange}
              placeholder="000000"
              className={`w-full h-11 rounded-lg border bg-white text-center px-0 text-3xl tracking-[0.3em] font-mono text-[#172B4D] placeholder:text-[#5E6C84] transition-all focus:outline-none ${
                  errorMessage ? "border-destructive focus:border-destructive" : "border-[#DFE1E6] hover:border-[#C1C7D0] focus:border-[#1768DB]"
              }`}
              required
              maxLength={6}
            />
            {errorMessage ? (
              <p className="text-sm font-medium text-destructive mt-2 animate-in fade-in text-center">
                {errorMessage}
              </p>
            ) : (
              <p className="text-xs text-[#5E6C84] mt-2 text-center">
                6-digit code (valid for 15 minutes)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full h-11 rounded-lg font-bold text-base bg-[#1768DB] hover:bg-[#1558BC] text-white transition-all shadow-md mt-2 disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#DFE1E6] text-center">
          <p className="text-sm text-[#5E6C84] mb-3">
            Didn&apos;t receive the code?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading || resendCountdown > 0}
            className="text-sm font-medium text-[#1768DB] hover:underline disabled:text-[#6B778C] disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendCountdown > 0
              ? `Resend code in ${resendCountdown}s`
              : "Resend Code"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth"
            className="text-sm font-medium text-[#1768DB] hover:underline"
          >
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          <div className="w-full max-w-[380px] mx-auto sm:max-w-[440px] sm:bg-white sm:rounded-2xl sm:border sm:border-[#DFE1E6] sm:shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-6 sm:p-10 flex flex-col space-y-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-8 w-1/2 bg-[#DFE1E6]/60 rounded-md" />
              <div className="h-4 w-3/4 bg-[#DFE1E6]/60 rounded-md" />
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-4 w-1/3 bg-[#DFE1E6]/60 rounded-md" />
              <div className="h-11 w-full bg-[#DFE1E6]/60 rounded-lg" />
            </div>
            <div className="h-11 w-full bg-[#DFE1E6]/60 rounded-lg mt-4" />
          </div>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
