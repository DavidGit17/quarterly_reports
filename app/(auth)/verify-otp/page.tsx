"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push("/auth");
    }
  }, [email, router]);

  useEffect(() => {
    if (email) inputRefs.current[0]?.focus();
  }, [email]);

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

  const handleBoxChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    if (!digit) return;

    const chars = otp.split("");
    chars[index] = digit;
    setOtp(chars.join(""));

    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = otp.split("");
      if (chars[index]) {
        chars[index] = "";
        setOtp(chars.join(""));
      } else if (index > 0) {
        chars[index - 1] = "";
        setOtp(chars.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleBoxPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center sm:justify-center pt-16 sm:pt-0 p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">

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
            <p className="text-sm font-medium text-[#172B4D] mb-1.5">
              Verification Code
            </p>
            <div className="flex gap-2 sm:gap-3 justify-center">
              {Array.from({ length: 6 }, (_, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={(e) => handleBoxChange(i, e.target.value)}
                  onKeyDown={(e) => handleBoxKeyDown(i, e)}
                  onPaste={i === 0 ? handleBoxPaste : undefined}
                  className={`w-11 h-12 sm:w-12 sm:h-14 rounded-xl border bg-white text-center text-xl sm:text-2xl font-bold text-[#172B4D] transition-all focus:outline-none focus:ring-1 focus:ring-[#1768DB] focus:border-[#1768DB] ${
                    otp[i] ? "border-[#1768DB]" : errorMessage ? "border-destructive" : "border-[#DFE1E6] hover:border-[#C1C7D0]"
                  }`}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
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
            className="group w-full h-11 rounded-lg font-bold text-base bg-[#1768DB] hover:bg-[#1558BC] text-white transition-all shadow-md mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
            {!isSubmitting && <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
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
        <div className="min-h-screen w-full flex flex-col items-center sm:justify-center pt-16 sm:pt-0 p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
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
