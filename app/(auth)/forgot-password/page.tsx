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
    const baseClasses = "w-full h-12 rounded-xl border bg-white px-4 text-base text-foreground placeholder:text-muted-foreground/75 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0";
    return `${baseClasses} ${hasError ? "border-destructive focus:border-destructive animate-shake" : "border-zinc-200 focus:border-primary"}`;
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
        } else if (lowerMsg.includes("user") || lowerMsg.includes("find")) {
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
    <div className="min-h-screen bg-luxury-glass flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="border rounded-3xl bg-white p-6 sm:p-8 shadow-sm">
          
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Forgot Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details to receive a reset link
            </p>
          </div>

          <form noValidate onSubmit={handleSendResetLink} className="space-y-5">
            
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
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
              className="w-full h-12 rounded-xl font-medium text-base transition-all mt-4 flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
              
              {!isSubmitting && (
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              )}
            </Button>

            {errorMessage && (
              <p className="text-sm text-destructive text-center font-medium animate-in fade-in">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="text-sm text-emerald-600 text-center font-medium animate-in fade-in">
                {successMessage}
              </p>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-100 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/auth"
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Verification is required to ensure account security.
        </p>
      </div>
    </div>
  );
}