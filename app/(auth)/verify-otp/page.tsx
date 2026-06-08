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
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
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

  useEffect(() => {
    if (!showSuccess || !redirectTo) return;
    const duration = 3200;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 100));
      if (currentStep >= steps) {
        clearInterval(timer);
        router.push(redirectTo);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [showSuccess, redirectTo, router]);

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
      let path = "/";
      let msg = "Getting things ready for you...";
      if (data.user?.role === "admin") {
        path = "/dashboard";
      } else if (data.user?.role === "coordinator") {
        path = "/";
      } else {
        path = "/f";
      }
      setRedirectTo(path);
      setSuccessMessage(msg);
      setShowSuccess(true);
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

  if (showSuccess) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-8 animate-in fade-in duration-700">
        <div className="w-full max-w-[400px] mx-auto">
          <svg
            viewBox="0 0 400 380"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md"
          >
            <defs>
              <filter
                id="shadow"
                x="-10"
                y="-10"
                width="150"
                height="150"
                filterUnits="userSpaceOnUse"
              >
                <feDropShadow
                  dx="0"
                  dy="8"
                  stdDeviation="12"
                  floodColor="#000000"
                  floodOpacity="0.1"
                />
              </filter>
              <style>{`@keyframes pulseBeam { 0% { r: 15; opacity: 0.6; } 100% { r: 45; opacity: 0; } } @keyframes flowDash { to { stroke-dashoffset: -20; } } .pulsing-signal { animation: pulseBeam 2s infinite cubic-bezier(0.24, 0, 0.38, 1); transform-origin: 265px 230px; } .pulsing-signal-delay { animation: pulseBeam 2s infinite cubic-bezier(0.24, 0, 0.38, 1); animation-delay: 1s; transform-origin: 265px 230px; } .flowing-dots { stroke-dasharray: 4, 4; animation: flowDash 1.2s linear infinite; }`}</style>
            </defs>
            <path d="M260 140 H 340 L 360 120 H 380" stroke="#a1a1aa" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="380" cy="120" r="4" fill="#a1a1aa" />
            <path d="M260 170 H 300 L 320 190 H 370" stroke="#a1a1aa" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="370" cy="190" r="4" fill="#a1a1aa" />
            <path d="M140 100 V 50 L 120 30 H 100" stroke="#a1a1aa" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="100" cy="30" r="4" fill="#a1a1aa" />
            <path d="M150 210 L 140 250 H 200 L 190 210 Z" fill="#e4e4e7" />
            <rect x="120" y="250" width="100" height="8" rx="4" fill="#a1a1aa" />
            <rect x="20" y="40" width="280" height="180" rx="16" fill="#27272a" />
            <rect x="23" y="43" width="274" height="174" rx="13" fill="#ffffff" />
            <rect x="26" y="46" width="60" height="168" fill="#f4f4f5" />
            <rect x="36" y="60" width="40" height="8" rx="4" fill="#e4e4e7" />
            <rect x="36" y="80" width="40" height="6" rx="3" fill="#e4e4e7" />
            <rect x="36" y="95" width="40" height="6" rx="3" fill="#e4e4e7" />
            <rect x="100" y="60" width="100" height="12" rx="6" fill="#e4e4e7" />
            <rect x="100" y="90" width="170" height="40" rx="6" fill="#e0f2fe" opacity="0.6" />
            <rect x="100" y="140" width="80" height="50" rx="6" fill="#d1fae5" opacity="0.6" />
            <rect x="190" y="140" width="80" height="50" rx="6" fill="#f4f4f5" />
            <path d="M60 280 H 340" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" />
            <path d="M90 280 L 110 300 H 290 L 310 280" stroke="#e4e4e7" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
            <circle cx="200" cy="300" r="3" fill="#a1a1aa" />
            <g transform="translate(70, 20)">
              <rect x="120" y="80" width="150" height="250" rx="20" fill="#27272a" />
              <rect x="123" y="83" width="144" height="244" rx="17" fill="#ffffff" />
              <path d="M165 83 H 225 V 95 C 225 100.5 220.5 105 215 105 H 175 C 169.5 105 165 100.5 165 95 V 83 Z" fill="#27272a" />
              <circle cx="265" cy="230" r="25" fill="none" stroke="#10b981" strokeWidth="1.5" className="pulsing-signal" />
              <circle cx="265" cy="230" r="25" fill="none" stroke="#10b981" strokeWidth="1.5" className="pulsing-signal-delay" />
              <circle cx="195" cy="160" r="28" stroke="#e4e4e7" strokeWidth="2" fill="#fafafa" />
              <circle cx="195" cy="154" r="10" fill="#27272a" />
              <path d="M177 178 C 177 168 183 162 195 162 C 207 162 213 168 213 178 V 188 H 177 V 178 Z" fill="#27272a" />
              <g transform="translate(10, 110)">
                <rect width="110" height="40" rx="8" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" filter="url(#shadow)" />
                <rect x="10" y="10" width="16" height="20" rx="3" fill="#27272a" />
                <line x1="40" y1="20" x2="90" y2="20" stroke="#10b981" strokeWidth="2" className="flowing-dots" />
              </g>
              <g transform="translate(120, 200)">
                <rect width="70" height="70" rx="16" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" filter="url(#shadow)" />
                <circle cx="35" cy="35" r="20" stroke="#e0f2fe" strokeWidth="3" fill="none" />
                <circle cx="35" cy="35" r="12" stroke="#d1fae5" strokeWidth="3" fill="none" />
                <circle cx="35" cy="35" r="6" stroke="#a1a1aa" strokeWidth="3" fill="none" />
              </g>
            </g>
          </svg>
        </div>
        <div className="w-full max-w-[320px] mt-10">
            <div className="h-1.5 bg-[#DFE1E6] rounded-full overflow-hidden">
              <div className="h-full bg-[#1768DB] rounded-full transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-[#5E6C84] mt-3 text-center">{successMessage}</p>
        </div>
      </div>
    );
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
