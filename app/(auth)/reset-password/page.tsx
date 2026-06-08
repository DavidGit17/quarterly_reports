"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

type ResetPasswordResponse = {
  message?: string;
};

type FormErrors = {
  email?: string;
  password?: string;
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFieldClassName = (hasError: boolean) => {
    const baseClasses =
      "w-full h-11 rounded-lg border bg-white px-4 text-base text-[#172B4D] placeholder:text-[#5E6C84] transition-all focus:outline-none";
    return `${baseClasses} ${hasError ? "border-destructive focus:border-destructive animate-shake" : "border-[#DFE1E6] hover:border-[#C1C7D0] focus:border-[#1768DB]"}`;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});

    let hasError = false;
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required.";
      hasError = true;
    }
    if (!newPassword) {
      newErrors.password = "Password is required.";
      hasError = true;
    } else if (newPassword.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    if (!token) {
      setErrorMessage("Missing reset token. Please use the link from your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = (await response.json().catch(() => ({}))) as ResetPasswordResponse;

      if (!response.ok) {
        const apiMsg = data.message || "Password reset failed.";
        const lowerMsg = apiMsg.toLowerCase();
        if (lowerMsg.includes("email")) {
          setFieldErrors({ email: apiMsg });
        } else if (lowerMsg.includes("password")) {
          setFieldErrors({ password: apiMsg });
        } else {
          setErrorMessage(apiMsg);
        }
        return;
      }

      setSuccessMessage(data.message || "Password reset successful.");

      setTimeout(() => {
        router.push("/unified-auth-page");
      }, 1500);
    } catch {
      setErrorMessage("Unable to reset password right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col select-none">
        <div className="flex-1 flex flex-col sm:items-center sm:justify-center pt-2 sm:p-6 lg:p-8">
          <div className="w-full max-w-[380px] mx-auto sm:max-w-[440px] sm:bg-white sm:rounded-2xl sm:border sm:border-[#DFE1E6] sm:shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-6 sm:p-10 text-center">
            <div className="flex flex-col items-center mb-10">
            <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-8 w-auto max-w-full" fetchPriority="high" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D] mb-2">
              Invalid Link
            </h2>
            <p className="text-sm text-[#5E6C84] mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#1768DB] hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
        <div className="w-full flex flex-col items-center pb-6">
          <div className="flex items-center gap-3 opacity-40">
            <span className="text-xs text-[#5E6C84]">&copy; 2026 Quarterly Reports Management System</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col select-none">

      <div className="flex-1 flex flex-col sm:items-center sm:justify-center pt-2 sm:p-6 lg:p-8">
        <div className="w-full max-w-[380px] mx-auto sm:max-w-[440px] sm:bg-white sm:rounded-2xl sm:border sm:border-[#DFE1E6] sm:shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-6 sm:p-10">

          <div className="flex flex-col items-center mb-10">
            <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-8 w-auto max-w-full" fetchPriority="high" />
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#172B4D]">
              Reset Password
            </h2>
            <p className="text-sm text-[#5E6C84] mt-2 max-w-[320px] mx-auto leading-relaxed">
              Enter your email and new password
            </p>
          </div>

          <form noValidate onSubmit={handleReset} className="space-y-4 sm:space-y-5">

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#172B4D] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                }}
                className={getFieldClassName(!!fieldErrors.email)}
                placeholder="Enter your email"
              />
              {fieldErrors.email && (
                <p className="text-sm font-medium text-destructive mt-1.5 animate-in fade-in">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-[#172B4D] mb-1.5">
                New Password
              </label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                }}
                className={getFieldClassName(!!fieldErrors.password)}
                placeholder="Create a new password"
              />
              {fieldErrors.password && (
                <p className="text-sm font-medium text-destructive mt-1.5 animate-in fade-in">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg font-bold text-base bg-[#1768DB] hover:bg-[#1558BC] text-white transition-all shadow-md mt-2 flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
              {!isSubmitting && (
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              )}
            </Button>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in">
                <p className="text-sm text-destructive text-center font-medium">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-in fade-in">
                <p className="text-sm text-emerald-700 text-center font-medium">{successMessage}</p>
              </div>
            )}

          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm text-[#5E6C84]">
              Remember your password?{" "}
              <Link
                href="/unified-auth-page"
                className="font-medium text-[#1768DB] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex flex-col items-center pb-6">
        <div className="flex items-center gap-3 opacity-40">
          <span className="text-xs text-[#5E6C84]">&copy; 2026 Quarterly Reports Management System</span>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-8">
          <div className="animate-pulse space-y-4 w-full max-w-[380px] mx-auto">
            <div className="flex flex-col items-center mb-4">
              <div className="h-28 w-28 bg-[#DFE1E6] rounded" />
            </div>
            <div className="h-8 w-48 bg-[#DFE1E6] rounded mx-auto" />
            <div className="h-4 w-64 bg-[#DFE1E6] rounded mx-auto" />
            <div className="h-12 w-full bg-[#DFE1E6] rounded" />
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
