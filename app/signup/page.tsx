"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SignupResponse = {
  message?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as SignupResponse;

      if (!response.ok) {
        setErrorMessage(data.message || "Signup failed.");
        return;
      }

      router.push("/login");
    } catch {
      setErrorMessage("Unable to sign up right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Sign Up</h1>
          <p className="text-muted-foreground mb-8">Create a new account</p>

          <form onSubmit={handleSignup} className="space-y-6">
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
                placeholder="Choose a username"
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
                placeholder="Create a password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>

            {errorMessage && (
              <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            )}
          </form>

          <div className="mt-8">
            <Link
              href="/login"
              className="text-center block text-secondary hover:underline"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
