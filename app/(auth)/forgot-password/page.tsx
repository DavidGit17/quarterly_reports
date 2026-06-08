"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ForgotPasswordResponse = {
  message?: string;
};

type FormErrors = {
  username?: string;
  email?: string;
};

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFieldClassName = (hasError: boolean) => {
    const baseClasses =
      "w-full h-11 rounded-lg border bg-white px-4 text-base text-[#172B4D] placeholder:text-[#5E6C84] transition-all focus:outline-none";
    return `${baseClasses} ${hasError ? "border-destructive focus:border-destructive animate-shake" : "border-[#DFE1E6] hover:border-[#C1C7D0] focus:border-[#1768DB]"}`;
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});

    let hasError = false;
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
      hasError = true;
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
        }),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as ForgotPasswordResponse;

      if (!response.ok) {
        const apiMsg = data.message || "Request failed.";
        const lowerMsg = apiMsg.toLowerCase();

        if (lowerMsg.includes("email")) {
          setFieldErrors({ email: apiMsg });
        } else if (lowerMsg.includes("username")) {
          setFieldErrors({ username: apiMsg });
        } else {
          setErrorMessage(apiMsg);
        }
        return;
      }

      setSuccessMessage(data.message || "If an account with that information exists, a reset link has been sent.");
    } catch {
      setErrorMessage("Unable to process request right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col select-none">

      <div className="flex-1 flex flex-col sm:items-center sm:justify-center pt-2 sm:p-6 lg:p-8">
        <div className="w-full max-w-[380px] mx-auto sm:max-w-[440px] sm:bg-white sm:rounded-2xl sm:border sm:border-[#DFE1E6] sm:shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-6 sm:p-10">

            <div className="flex flex-col items-center mb-10">
            <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-8 w-auto max-w-full" />
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#172B4D]">
              Forgot password
            </h2>
            <p className="text-sm text-[#5E6C84] mt-2 max-w-[320px] mx-auto leading-relaxed">
              Enter your details to receive a reset link
            </p>
          </div>

          <form noValidate onSubmit={handleSendResetLink} className="space-y-4 sm:space-y-5">

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#172B4D] mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                }}
                className={getFieldClassName(!!fieldErrors.username)}
                placeholder="Enter your username"
              />
              {fieldErrors.username && (
                <p className="text-sm font-medium text-destructive mt-1.5 animate-in fade-in">
                  {fieldErrors.username}
                </p>
              )}
            </div>

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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg font-bold text-base bg-[#1768DB] hover:bg-[#1558BC] text-white transition-all shadow-md mt-2 flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
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
