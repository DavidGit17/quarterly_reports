"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-luxury-glass">
      
      {/* Premium Elevated Card to match auth flow */}
      <div className="w-full max-w-md bg-card border border-zinc-900 rounded-[28px]  p-6 sm:p-8 relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-500">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Verify Email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the verification code sent to <br />
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <Label
              htmlFor="otp"
              className="text-sm font-semibold text-foreground mb-1.5 block"
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
              className={`w-full h-14 rounded-xl border bg-background px-4 text-center text-3xl tracking-[0.3em] font-mono text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                errorMessage ? "border-destructive focus:border-destructive animate-shake" : "border-border focus:border-primary"
              }`}
              required
              maxLength={6}
            />
            {errorMessage ? (
              <p className="text-sm font-medium text-destructive mt-2 animate-in fade-in text-center">
                {errorMessage}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                6-digit code (valid for 15 minutes)
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full h-11 sm:h-12 rounded-xl mt-4 font-semibold text-base transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/80 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Didn&apos;t receive the code?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading || resendCountdown > 0}
            className="text-sm font-semibold text-primary hover:underline transition-colors disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendCountdown > 0
              ? `Resend code in ${resendCountdown}s`
              : "Resend Code"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth"
            className="text-sm font-semibold text-primary hover:underline transition-colors"
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
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-luxury-glass">
          {/* Skeleton matches the exact neo-brutalist card shape */}
          <div className="w-full max-w-md bg-card border-[4px] border-zinc-900 rounded-[28px] shadow-[8px_8px_0px_#18181b] p-6 sm:p-8 flex flex-col space-y-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-8 w-1/2 bg-zinc-200/60 rounded-md" />
              <div className="h-4 w-3/4 bg-zinc-200/60 rounded-md" />
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-4 w-1/3 bg-zinc-200/60 rounded-md" />
              <div className="h-14 w-full bg-zinc-200/60 rounded-xl" />
            </div>
            <div className="h-12 w-full bg-zinc-200/60 rounded-xl mt-4" />
          </div>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}