"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";

type ForgotPasswordResponse = {
  message?: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
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
          newPassword,
        }),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as ForgotPasswordResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Password reset failed.");
        return;
      }

      setSuccessMessage(data.message || "Password reset successful.");

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch {
      setErrorMessage("Unable to reset password right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Forgot Password
          </h1>
          <p className="text-muted-foreground mb-8">
            Reset your account password
          </p>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                New Password
              </label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                placeholder="Create a new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>

            {errorMessage && (
              <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            )}

            {successMessage && (
              <p className="text-sm text-green-600 text-center">
                {successMessage}
              </p>
            )}
          </form>

          <div className="mt-8">
            <Link
              href="/login"
              className="text-center block text-secondary hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
