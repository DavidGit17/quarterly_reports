"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  COORDINATOR_PROJECT_OPTIONS,
  getFormConfigs,
} from "@/lib/shared/form-storage";
import { useToast } from "@/hooks/shared/use-toast";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Info, ArrowRight, User, Folder } from "lucide-react";

type AuthMode = "login" | "signup";

type LoginResponse = {
  role?: "admin" | "coordinator" | "facilitator";
  project?: string;
  message?: string;
};

type FormErrors = {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  project?: string;
};

export default function UnifiedAuthPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<
    "coordinator" | "facilitator" | "admin" | ""
  >("");
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [project, setProject] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    if (authMode === "signup") {
      try {
        const configs = getFormConfigs();
        const projects = Object.keys(configs).sort();
        setProjectOptions(projects);
      } catch {
        setProjectOptions(Array.from(COORDINATOR_PROJECT_OPTIONS));
      }
    }
  }, [authMode]);

  useEffect(() => {
    if (!loginSuccess || !loginRedirectTo) return;
    const duration = 1500;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setLoginProgress(Math.min((currentStep / steps) * 100, 100));
      if (currentStep >= steps) {
        clearInterval(timer);
        router.push(loginRedirectTo);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [loginSuccess, loginRedirectTo, router]);

  const toggleAuthMode = (mode: AuthMode) => {
    if (authMode === mode) return;
    setAuthMode(mode);
    setFieldErrors({});
    setErrorMessage("");
  };

  const getFieldClassName = (hasError: boolean) => {
    const baseClasses =
      "w-full h-12 rounded-xl border bg-white/80 px-4 text-base text-zinc-900 placeholder:text-zinc-400 transition-all focus:outline-none";
    return `${baseClasses} ${hasError ? "border-destructive focus:border-destructive animate-shake" : "border-zinc-200 focus:border-[#5B51D8] focus:ring-2 focus:ring-[#5B51D8]/20"}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});
    let hasError = false;
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Password is required.";
      hasError = true;
    }
    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.role) {
        const apiMsg = data.message || "Login failed.";
        const lowerMsg = apiMsg.toLowerCase();
        if (
          lowerMsg.includes("password") ||
          lowerMsg.includes("incorrect") ||
          lowerMsg.includes("match")
        )
          setFieldErrors({ password: apiMsg });
        else if (
          lowerMsg.includes("user") ||
          lowerMsg.includes("exist") ||
          lowerMsg.includes("found")
        )
          setFieldErrors({ username: apiMsg });
        else if (lowerMsg.includes("credential"))
          setFieldErrors({ password: apiMsg });
        else setErrorMessage(apiMsg);
        return;
      }

      let msg = "";
      let path = "";
      if (data.role === "admin") {
        msg = "Welcome Back! Preparing your dashboard...";
        path = "/dashboard";
      } else if (data.role === "coordinator") {
        msg = "Welcome Back! Loading your workspace...";
        path = "/";
      } else if (data.role === "facilitator") {
        msg = "Welcome Back! Loading your workspace...";
        path = "/f";
      } else if (!data.project) {
        setErrorMessage("Project is not assigned to your account.");
        return;
      } else {
        msg = "Welcome Back! Loading your workspace...";
        path = "/";
      }
      setLoginMessage(msg);
      setLoginRedirectTo(path);
      setLoginSuccess(true);
    } catch {
      setFieldErrors({ username: "Unable to connect. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
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
    if (!password) {
      newErrors.password = "Password is required.";
      hasError = true;
    }
    if (!role) {
      newErrors.role = "Please select a role.";
      hasError = true;
    }
    if ((role === "coordinator" || role === "facilitator") && !project) {
      newErrors.project = "Please select a project.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }
    setIsSubmitting(true);

    try {
      const sendOtpResponse = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username }),
      });
      const sendOtpData = await sendOtpResponse.json();

      if (!sendOtpResponse.ok) {
        const apiMsg =
          sendOtpData.message || "Failed to send verification code.";
        const lowerMsg = apiMsg.toLowerCase();
        if (lowerMsg.includes("email")) setFieldErrors({ email: apiMsg });
        else if (lowerMsg.includes("user") || lowerMsg.includes("name"))
          setFieldErrors({ username: apiMsg });
        else if (lowerMsg.includes("password"))
          setFieldErrors({ password: apiMsg });
        else setErrorMessage(apiMsg);
        return;
      }

      toast({
        title: "Verification Code Sent",
        description: `We have sent a code to ${email}. Check your inbox.`,
      });
      sessionStorage.setItem("signup_password", password);
      const params = new URLSearchParams({
        email,
        username,
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

  if (loginSuccess) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#eff4fa] animate-in fade-in duration-700">
        <div className="flex items-center gap-2.5 px-6 sm:px-8 lg:px-10 pt-3 sm:pt-4 lg:pt-5">
          <svg viewBox="0 0 40 40" width="30" height="30" className="shrink-0">
            <rect x="4" y="8" width="32" height="28" rx="6" fill="#5B51D8" opacity="0.12" />
            <rect x="8" y="12" width="24" height="20" rx="3" fill="white" stroke="#5B51D8" strokeWidth="1.5" />
            <rect x="12" y="17" width="7" height="2" rx="1" fill="#5B51D8" opacity="0.5" />
            <rect x="12" y="22" width="12" height="2" rx="1" fill="#5B51D8" opacity="0.5" />
            <rect x="12" y="27" width="9" height="2" rx="1" fill="#5B51D8" opacity="0.5" />
            <path d="M25 15 L 27 18 L 30 16" stroke="#5B51D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <div>
            <p className="text-sm font-bold text-zinc-900 tracking-tight leading-tight">Quarterly Reports</p>
            <p className="text-[11px] text-zinc-400 leading-tight">Management System</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-3 sm:py-4 lg:py-5">
          <div className="w-full max-w-[400px] mx-auto">
          <svg
            viewBox="0 0 400 380"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <style>{`@keyframes ringPulse { 0% { r: 75; opacity: 0.4; } 100% { r: 110; opacity: 0; } } @keyframes ringPulse2 { 0% { r: 85; opacity: 0.3; } 100% { r: 130; opacity: 0; } } .pulse-ring1 { animation: ringPulse 2.5s infinite cubic-bezier(0.24, 0, 0.38, 1); transform-origin: 200px 180px; } .pulse-ring2 { animation: ringPulse2 2.5s infinite cubic-bezier(0.24, 0, 0.38, 1); animation-delay: 0.8s; transform-origin: 200px 180px; } @keyframes checkDraw { to { stroke-dashoffset: 0; } } .check-path { stroke-dasharray: 40; stroke-dashoffset: 40; animation: checkDraw 0.5s ease-out 0.3s forwards; }`}</style>
            </defs>
            <circle cx="100" cy="80" r="5" fill="#a1a1aa" opacity="0.3" />
            <circle cx="310" cy="70" r="3" fill="#a1a1aa" opacity="0.25" />
            <circle cx="340" cy="290" r="6" fill="#a1a1aa" opacity="0.2" />
            <circle cx="60" cy="300" r="4" fill="#a1a1aa" opacity="0.25" />
            <circle cx="200" cy="45" r="3" fill="#a1a1aa" opacity="0.3" />
            <circle cx="200" cy="180" r="75" fill="none" stroke="#a1a1aa" strokeWidth="1.5" opacity="0.25" className="pulse-ring1" />
            <circle cx="200" cy="180" r="85" fill="none" stroke="#a1a1aa" strokeWidth="1" opacity="0.15" className="pulse-ring2" />
            <path d="M200 85 L 260 115 V 185 C 260 235 235 265 200 280 C 165 265 140 235 140 185 V 115 Z" stroke="#a1a1aa" strokeWidth="2" fill="#fafafa" />
            <path d="M200 105 L 242 125 V 180 C 242 218 225 240 200 250 C 175 240 158 218 158 180 V 125 Z" fill="#f4f4f5" />
            <path d="M172 185 L 192 205 L 228 170" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-path" />
          </svg>
        </div>
        <div className="w-full max-w-[320px] mt-10">
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#5B51D8] rounded-full transition-all duration-100 ease-out" style={{ width: `${loginProgress}%` }} />
          </div>
          <p className="text-sm text-zinc-500 mt-3 text-center">{loginMessage}</p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col select-none overflow-x-hidden bg-[#eff4fa]">
      <div className="flex items-center gap-2.5 px-6 sm:px-8 lg:px-10 pt-3 sm:pt-4 lg:pt-5">
        <svg viewBox="0 0 40 40" width="30" height="30" className="shrink-0">
          <rect x="4" y="8" width="32" height="28" rx="6" fill="#5B51D8" opacity="0.12" />
          <rect x="8" y="12" width="24" height="20" rx="3" fill="white" stroke="#5B51D8" strokeWidth="1.5" />
          <rect x="12" y="17" width="7" height="2" rx="1" fill="#5B51D8" opacity="0.5" />
          <rect x="12" y="22" width="12" height="2" rx="1" fill="#5B51D8" opacity="0.5" />
          <rect x="12" y="27" width="9" height="2" rx="1" fill="#5B51D8" opacity="0.5" />
          <path d="M25 15 L 27 18 L 30 16" stroke="#5B51D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div>
          <p className="text-sm font-bold text-zinc-900 tracking-tight leading-tight">Quarterly Reports</p>
          <p className="text-[11px] text-zinc-400 leading-tight">Management System</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
        <div className="w-full max-w-[420px] bg-[#ffffff] backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 relative">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-zinc-900">
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {authMode === "login"
                ? "Sign in to continue to your dashboard"
                : "Sign up to get started with your account"}
            </p>
          </div>

          {authMode === "login" ? (
            <div key="login" className="w-full animate-in fade-in duration-300 ease-out">
              <form noValidate onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div>
                  <input
                    id="login-username" type="text" value={username}
                    onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined }); }}
                    className={getFieldClassName(!!fieldErrors.username)}
                    placeholder="Username"
                  />
                  {fieldErrors.username && <p className="text-sm font-medium text-destructive mt-1.5 animate-in fade-in">{fieldErrors.username}</p>}
                </div>
                <div>
                  <PasswordInput
                    id="login-password" value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined }); }}
                    className={getFieldClassName(!!fieldErrors.password)}
                    placeholder="Password"
                  />
                  {fieldErrors.password && <p className="text-sm font-medium text-destructive mt-1.5 animate-in fade-in">{fieldErrors.password}</p>}
                </div>
                <div className="flex justify-end -mt-1">
                  <Link href="/forgot-password" className="text-sm font-medium text-[#5B51D8] hover:underline transition-colors">Forgot password?</Link>
                </div>
                <Button type="submit" disabled={isSubmitting}
                  className="w-full h-12 sm:h-[52px] rounded-xl font-bold text-base bg-[#5B51D8] hover:bg-[#4a42b8] text-white transition-all shadow-md mt-2"
                >
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>
              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in">
                  <p className="text-sm text-destructive text-center font-medium">{errorMessage}</p>
                </div>
              )}
              <div className="space-y-3 mt-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => toast({ title: "Coming Soon", description: "Google OAuth is not yet configured." })}
                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-600"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Google
                  </button>
                  <button type="button"
                    onClick={() => toast({ title: "Coming Soon", description: "Microsoft OAuth is not yet configured." })}
                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-600"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="2" width="9.6" height="9.6" fill="#F25022" rx="1.5" /><rect x="12.4" y="2" width="9.6" height="9.6" fill="#7FBA00" rx="1.5" /><rect x="2" y="12.4" width="9.6" height="9.6" fill="#00A4EF" rx="1.5" /><rect x="12.4" y="12.4" width="9.6" height="9.6" fill="#FFB900" rx="1.5" /></svg>
                    Outlook
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div key="signup" className="w-full animate-in fade-in duration-300 ease-out">
              <form noValidate onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
                <div>
                  <input
                    id="signup-username" type="text" value={username}
                    onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined }); }}
                    className={getFieldClassName(!!fieldErrors.username)}
                    placeholder="Full Name (or Teams ID)"
                  />
                  {fieldErrors.username ? (
                    <p className="text-sm font-medium text-destructive mt-1.5">{fieldErrors.username}</p>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5"><Info className="size-3.5 shrink-0" /><span>Use Teams ID for Coordinator/Facilitator</span></p>
                  )}
                </div>
                <div>
                  <input
                    id="signup-email" type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined }); }}
                    className={getFieldClassName(!!fieldErrors.email)}
                    placeholder="Email Address"
                  />
                  {fieldErrors.email && <p className="text-sm font-medium text-destructive mt-1.5">{fieldErrors.email}</p>}
                </div>
                <div>
                  <PasswordInput
                    id="signup-password" value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined }); }}
                    className={getFieldClassName(!!fieldErrors.password)}
                    placeholder="Password"
                  />
                  {fieldErrors.password && <p className="text-sm font-medium text-destructive mt-1.5">{fieldErrors.password}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><User className="size-4 text-zinc-400" /></div>
                    <select
                      id="signup-role" value={role}
                      onChange={(e) => { setRole(e.target.value as "coordinator" | "facilitator" | "admin" | ""); if (fieldErrors.role) setFieldErrors({ ...fieldErrors, role: undefined }); }}
                      className={`${getFieldClassName(!!fieldErrors.role)} pl-10 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a1a1aa%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2rem] bg-[right_0.5rem_center] bg-no-repeat`}
                    >
                      <option value="" disabled hidden>Role</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="facilitator">Facilitator</option>
                      <option value="admin">Admin</option>
                    </select>
                    {fieldErrors.role && <p className="text-xs font-medium text-destructive mt-1.5">{fieldErrors.role}</p>}
                  </div>
                  {(role === "coordinator" || role === "facilitator") && (
                    <div className="relative animate-in fade-in duration-300">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Folder className="size-4 text-zinc-400" /></div>
                      {projectOptions.length === 0 ? (
                        <p className="text-xs text-destructive font-medium pt-3">No projects found.</p>
                      ) : (
                        <>
                          <select
                            id="signup-project" value={project}
                            onChange={(e) => { setProject(e.target.value); if (fieldErrors.project) setFieldErrors({ ...fieldErrors, project: undefined }); }}
                            className={`${getFieldClassName(!!fieldErrors.project)} pl-10 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a1a1aa%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2rem] bg-[right_0.5rem_center] bg-no-repeat`}
                          >
                            <option value="" disabled hidden>Project</option>
                            {projectOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                          </select>
                          {fieldErrors.project && <p className="text-xs font-medium text-destructive mt-1.5">{fieldErrors.project}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting}
                  className="group w-full h-12 sm:h-[52px] rounded-xl font-bold text-base bg-[#5B51D8] hover:bg-[#4a42b8] text-white transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Creating Account..." : "Sign Up"}
                  {!isSubmitting && <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
                </Button>
              </form>
              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in">
                  <p className="text-sm text-destructive text-center font-medium">{errorMessage}</p>
                </div>
              )}
              <div className="space-y-3 mt-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => toast({ title: "Coming Soon", description: "Google OAuth is not yet configured." })}
                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-600"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Google
                  </button>
                  <button type="button"
                    onClick={() => toast({ title: "Coming Soon", description: "Microsoft OAuth is not yet configured." })}
                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-600"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="2" width="9.6" height="9.6" fill="#F25022" rx="1.5" /><rect x="12.4" y="2" width="9.6" height="9.6" fill="#7FBA00" rx="1.5" /><rect x="2" y="12.4" width="9.6" height="9.6" fill="#00A4EF" rx="1.5" /><rect x="12.4" y="12.4" width="9.6" height="9.6" fill="#FFB900" rx="1.5" /></svg>
                    Outlook
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 sm:mt-8 text-center">
            {authMode === "signup" ? (
              <p className="text-sm text-zinc-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => toggleAuthMode("login")}
                  className="font-medium text-[#5B51D8] hover:underline"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                Do not have an account?{" "}
                <button
                  type="button"
                  onClick={() => toggleAuthMode("signup")}
                  className="font-medium text-[#5B51D8] hover:underline"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
