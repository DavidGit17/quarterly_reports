"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  COORDINATOR_PROJECT_OPTIONS,
  getFormConfigs,
} from "@/lib/shared/form-storage";
import { useToast } from "@/hooks/shared/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"coordinator" | "facilitator" | "admin" | "">("");
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [project, setProject] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldClassName =
    "w-full rounded border border-border bg-white px-4 py-2 text-foreground placeholder:text-muted-foreground/75 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary-fixed-dim)_45%,transparent)]";

  // Load available projects from form configs
  useEffect(() => {
    try {
      const configs = getFormConfigs();
      const projects = Object.keys(configs).sort();
      setProjectOptions(projects);
      if (projects.length > 0) {
        setProject(projects[0]);
      }
    } catch {
      // Fallback to hardcoded options if getFormConfigs fails
      setProjectOptions(Array.from(COORDINATOR_PROJECT_OPTIONS));
      if (COORDINATOR_PROJECT_OPTIONS.length > 0) {
        setProject(COORDINATOR_PROJECT_OPTIONS[0]);
      }
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    if (!role) {
      setErrorMessage("Please select a role.");
      setIsSubmitting(false);
      return;
    }

    if (!username || !email || !password) {
      setErrorMessage("All fields are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Send OTP to email
      const sendOtpResponse = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username,
        }),
      });

      const sendOtpData = await sendOtpResponse.json();

      if (!sendOtpResponse.ok) {
        setErrorMessage(
          sendOtpData.message || "Failed to send verification code.",
        );
        return;
      }

      // Show success toast
      toast({
        title: "Verification Code Sent",
        description: `We've sent a code to ${email}. Check your inbox.`,
      });

      // Step 2: Redirect to OTP verification page with form data
      const params = new URLSearchParams({
        email,
        username,
        password,
        role,
        ...(role !== "admin" && { project }),
      });

      router.push(`/verify-otp?${params.toString()}`);
    } catch {
      setErrorMessage("Unable to sign up right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded border border-border bg-white p-8">
          <h1 className="mb-2 text-3xl font-semibold tracking-[-0.02em] text-primary">Sign Up</h1>
          <p className="text-muted-foreground mb-8">Create a new account</p>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <Label htmlFor="username" className="mb-2">
                Username
              </Label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={fieldClassName}
                placeholder="Choose a username"
                aria-describedby="username-helper"
                required
              />
              <p
                id="username-helper"
                className="text-xs text-muted-foreground/80 mt-2 flex items-center gap-1.5"
              >
                <Info className="size-3.5 shrink-0" />
                Use Teams ID as username if you are a coordinator
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="mb-2">
                Email
              </Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClassName}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-2">
                Password
              </Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClassName}
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <Label htmlFor="role" className="mb-2">
                Role <span className="text-destructive">*</span>
              </Label>
              <select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value as "coordinator" | "facilitator" | "admin",
                  )
                }
                className={fieldClassName}
                required
              >
                <option value="">-- Select a role --</option>
                <option value="coordinator">Coordinator</option>
                <option value="facilitator">Facilitator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {(role === "coordinator" || role === "facilitator") && (
              <div>
                <Label htmlFor="project" className="mb-2">
                  Project <span className="text-destructive">*</span>
                </Label>
                {projectOptions.length === 0 ? (
                  <p className="text-sm text-destructive">
                    No projects available. Please contact admin to create
                    projects.
                  </p>
                ) : (
                  <select
                    id="project"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className={fieldClassName}
                    required
                  >
                    {projectOptions.map((projectOption) => (
                      <option key={projectOption} value={projectOption}>
                        {projectOption}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>

            {errorMessage && (
              <p className="text-sm text-destructive text-center">
                {errorMessage}
              </p>
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
