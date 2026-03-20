"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const toDisplayName = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
    const role = normalizedUsername.toLowerCase().includes("admin")
      ? "admin"
      : "coordinator";

    const sessionUser = {
      username: toDisplayName(normalizedUsername),
      email: `${normalizedUsername.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      role,
    };

    localStorage.setItem("reporting-user", JSON.stringify(sessionUser));

    // Simulate different roles based on username
    if (role === "admin") {
      router.push("/dashboard");
    } else {
      router.push("/select");
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordMessage(
      "Forgot password will be available after the next development update.",
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Login</h1>
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
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-8 space-y-3">
            <Link
              href="/signup"
              className="block text-center text-secondary hover:underline"
            >
              Create an account
            </Link>
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="block w-full text-center text-secondary hover:underline"
            >
              Forgot Password?
            </button>
            {forgotPasswordMessage && (
              <p className="text-center text-sm text-muted-foreground">
                {forgotPasswordMessage}
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Tip: Use username with "admin" to see admin dashboard
        </p>
      </div>
    </div>
  );
}
