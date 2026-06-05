"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input";

type ResetPasswordResponse = {
  message?: string;
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    if (!token) {
      setErrorMessage("Missing reset token. Please use the link from your email.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = (await response.json().catch(() => ({}))) as ResetPasswordResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Password reset failed.");
        return;
      }

      setSuccessMessage(data.message || "Password reset successful.");

      setTimeout(() => {
        router.push("/auth");
      }, 1500);
    } catch {
      setErrorMessage("Unable to reset password right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-border p-8 text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">Invalid Link</h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password" className="text-secondary hover:underline">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Reset Password</h1>
          <p className="text-muted-foreground mb-8">Enter your email and new password</p>

          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-[#1768DB] bg-white"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-[#1768DB] bg-white"
                placeholder="Create a new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-[#113263] transition-colors"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>

            {errorMessage && (
              <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            )}

            {successMessage && (
              <p className="text-sm text-green-600 text-center">{successMessage}</p>
            )}
          </form>

          <div className="mt-8">
            <Link href="/auth" className="text-center block text-secondary hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md p-8">
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
