"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toProjectSlug } from "@/lib/shared/form-storage";
import { PasswordInput } from "@/components/ui/password-input";

type LoginResponse = {
  role?: "admin" | "coordinator" | "facilitator";
  project?: string;
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldClassName =
    "w-full rounded border border-border bg-white px-4 py-3 text-foreground placeholder:text-muted-foreground/75 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary-fixed-dim)_45%,transparent)]";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.role) {
        setErrorMessage(data.message || "Login failed.");
        return;
      }

      if (data.role === "admin") {
        router.push("/dashboard");
        return;
      }

      if (!data.project) {
        setErrorMessage("Project is not assigned to your account.");
        return;
      }

      const projectSlug = data.project.toLowerCase().replace(/\s+/g, "-"); router.push(`/form/${projectSlug}`);
    } catch {
      setErrorMessage("User is not registered.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded border border-border bg-white p-8">
          <h1 className="mb-2 text-3xl font-semibold tracking-[-0.02em] text-primary">
            Login
          </h1>
          <p className="text-muted-foreground mb-8">
            Quarterly Reports Management System
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={fieldClassName}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClassName}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-primary py-2 font-medium text-primary-foreground transition-colors hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary-fixed-dim)_55%,transparent)] disabled:opacity-60"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            {errorMessage && (
              <p className="text-center text-sm text-destructive">
                {errorMessage}
              </p>
            )}
          </form>

          <div className="mt-8 space-y-3">
            <Link
              href="/signup"
              className="block text-center text-secondary hover:underline"
            >
              Create an account
            </Link>
            <Link
              href="/forgot-password"
              className="block w-full text-center text-secondary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Use your registered account to continue.
        </p>
      </div>
    </div>
  );
}
