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
    const duration = 2800;
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
      "w-full h-12 rounded-xl border bg-white px-4 text-base text-[#172B4D] placeholder:text-[#5E6C84] transition-all focus:outline-none";
    return `${baseClasses} ${hasError ? "border-destructive focus:border-destructive animate-shake" : "border-[#DFE1E6] hover:border-[#C1C7D0] focus:border-[#1768DB]"}`;
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
        msg = "";
        path = "/dashboard";
      } else if (data.role === "coordinator") {
        msg = "";
        path = "/";
      } else if (data.role === "facilitator") {
        msg = "";
        path = "/f";
      } else if (!data.project) {
        setErrorMessage("Project is not assigned to your account.");
        return;
      } else {
        msg = "";
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
      <div className="min-h-screen w-full bg-[#F8FAFC] animate-in fade-in duration-700 relative overflow-hidden flex flex-col items-center justify-center">
        <div className="relative z-10 flex flex-col items-center px-6">
          {/* Heading and subheading */}
          <h1 className="text-3xl font-bold text-[#172B4D] text-center">
            Preparing your workspace
          </h1>
          <p className="text-[#5E6C84] mt-2 text-center">
            Please wait while we verify your access
          </p>
          <div className="w-full max-w-[300px] mt-8">
            <svg viewBox="0 0 400 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <style>{`@keyframes ringPulse { 0% { r: 75; opacity: 0.18; } 100% { r: 100; opacity: 0; } } @keyframes ringPulse2 { 0% { r: 80; opacity: 0.12; } 100% { r: 115; opacity: 0; } } .pulse-ring1 { animation: ringPulse 2.5s infinite cubic-bezier(0.24, 0, 0.38, 1); transform-origin: 200px 180px; } .pulse-ring2 { animation: ringPulse2 2.5s infinite cubic-bezier(0.24, 0, 0.38, 1); animation-delay: 0.8s; transform-origin: 200px 180px; } @keyframes checkDraw { to { stroke-dashoffset: 0; } } .check-path { stroke-dasharray: 120; stroke-dashoffset: 120; animation: checkDraw 0.8s ease-out 0.2s forwards; }`}</style>
              </defs>
              <circle cx="100" cy="80" r="5" fill="#1768DB" opacity="0.35" />
              <circle cx="310" cy="70" r="3" fill="#1768DB" opacity="0.3" />
              <circle cx="340" cy="290" r="6" fill="#1768DB" opacity="0.25" />
              <circle cx="60" cy="300" r="4" fill="#1768DB" opacity="0.3" />
              <circle cx="200" cy="45" r="3" fill="#1768DB" opacity="0.35" />
              <circle cx="200" cy="180" r="75" fill="none" stroke="#1768DB" strokeWidth="1.5" opacity="0.18" className="pulse-ring1" />
              <circle cx="200" cy="180" r="80" fill="none" stroke="#1768DB" strokeWidth="1" opacity="0.12" className="pulse-ring2" />
              <path d="M200 95 L 270 125 V 180 C 270 225 242 255 200 270 C 158 255 130 225 130 180 V 125 Z" stroke="#1768DB" strokeWidth="2" fill="#F8FAFC" />
              <path d="M200 118 L 248 134 V 176 C 248 210 228 232 200 242 C 172 232 152 210 152 176 V 134 Z" fill="#F1F2F4" />
              <path d="M170 188 L 194 212 L 242 158" stroke="#1768DB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="check-path" />
            </svg>
          </div>
          <div className="w-full max-w-[280px] mt-6">
            <div className="h-1.5 bg-[#DFE1E6] rounded-full overflow-hidden">
              <div className="h-full bg-[#1768DB] rounded-full transition-all duration-100 ease-out" style={{ width: `${loginProgress}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col select-none">


      {/* Centered Card */}
      <div className="flex-1 flex flex-col sm:items-center sm:justify-center relative z-10 pt-8 sm:p-6 lg:p-8">
          <div className="w-full max-w-[380px] mx-auto sm:max-w-[440px] sm:bg-white sm:rounded-2xl sm:border sm:border-[#DFE1E6] sm:shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-6 sm:p-10">
            {/* Logo centered at top */}
            <div className="flex flex-col items-center mb-8">
              <img src="/brand/QRMS.webp" alt="Quarterly Reports" className="h-12 w-auto max-w-full" />
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D]">
                {authMode === "login" ? "Log in to continue" : "Create account"}
              </h2>
              <p className="text-sm text-[#5E6C84] mt-2 max-w-[320px] mx-auto leading-relaxed">
                {authMode === "login"
                  ? "Access your reports, forms and workflows securely"
                  : "Sign up to get started with your account"}
              </p>
            </div>
  
            {authMode === "login" ? (
              <div key="login" className="w-full animate-in fade-in duration-300 ease-out">
                <form noValidate onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                  <div>
                    <label htmlFor="login-username" className="block text-sm font-medium text-[#172B4D] mb-1.5">Username</label>
                    <input
                      id="login-username" type="text" value={username}
                      onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined }); }}
                      className={getFieldClassName(!!fieldErrors.username)}
                      placeholder="Enter your username"
                    />
                    {fieldErrors.username && <p className="text-sm font-medium text-destructive mt-1.5 animate-in fade-in">{fieldErrors.username}</p>}
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-[#172B4D] mb-1.5">Password</label>
                    <PasswordInput
                      id="login-password" value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined }); }}
                      className={getFieldClassName(!!fieldErrors.password)}
                      placeholder="Enter your password"
                    />
                    {fieldErrors.password && <p className="text-sm font-medium text-destructive mt-1.5 animate-in fade-in">{fieldErrors.password}</p>}
                  </div>
                  <div className="flex items-center justify-between -mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#DFE1E6] text-[#1768DB] focus:ring-[#1768DB]/20" />
                      <span className="text-sm text-[#172B4D] select-none">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-sm font-medium text-[#1768DB] hover:underline transition-colors">Forgot password?</Link>
                  </div>
                  <Button type="submit" disabled={isSubmitting}
                    className="w-full h-12 sm:h-[52px] rounded-xl font-bold text-base bg-[#1768DB] hover:bg-[#1558BC] text-white transition-all shadow-md mt-2"
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
                    <div className="flex-1 h-px bg-[#DFE1E6]" />
                    <span className="text-xs text-[#6B778C] font-medium uppercase tracking-wider">or continue with</span>
                    <div className="flex-1 h-px bg-[#DFE1E6]" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => toast({ title: "Coming Soon", description: "Google OAuth is not yet configured." })}
                      className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-[#DFE1E6] bg-white hover:bg-[#F1F2F4] transition-colors text-sm font-medium text-[#5E6C84]"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                      Google
                    </button>
                    <button type="button"
                      onClick={() => toast({ title: "Coming Soon", description: "Microsoft OAuth is not yet configured." })}
                      className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-[#DFE1E6] bg-white hover:bg-[#F1F2F4] transition-colors text-sm font-medium text-[#5E6C84]"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="2" width="9.6" height="9.6" fill="#F25022" rx="1.5" /><rect x="12.4" y="2" width="9.6" height="9.6" fill="#7FBA00" rx="1.5" /><rect x="2" y="12.4" width="9.6" height="9.6" fill="#00A4EF" rx="1.5" /><rect x="12.4" y="12.4" width="9.6" height="9.6" fill="#FFB900" rx="1.5" /></svg>
                      Microsoft
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
                      placeholder="Username"
                    />
                    {fieldErrors.username ? (
                      <p className="text-sm font-medium text-destructive mt-1.5">{fieldErrors.username}</p>
                    ) : (
                      <p className="text-xs text-[#5E6C84] mt-1.5 flex items-center gap-1.5"><Info className="size-3.5 shrink-0" /><span>Use Teams ID as username for Coordinator/Facilitator</span></p>
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
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><User className="size-4 text-[#6B778C]" /></div>
                      <select
                        id="signup-role" value={role}
                        onChange={(e) => { setRole(e.target.value as "coordinator" | "facilitator" | "admin" | ""); if (fieldErrors.role) setFieldErrors({ ...fieldErrors, role: undefined }); }}
                        className={`${getFieldClassName(!!fieldErrors.role)} pl-10 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2rem] bg-[right_0.5rem_center] bg-no-repeat`}
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
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Folder className="size-4 text-[#6B778C]" /></div>
                        {projectOptions.length === 0 ? (
                          <p className="text-xs text-destructive font-medium pt-3">No projects found.</p>
                        ) : (
                          <>
                            <select
                              id="signup-project" value={project}
                              onChange={(e) => { setProject(e.target.value); if (fieldErrors.project) setFieldErrors({ ...fieldErrors, project: undefined }); }}
                              className={`${getFieldClassName(!!fieldErrors.project)} pl-10 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2rem] bg-[right_0.5rem_center] bg-no-repeat`}
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
                    className="group w-full h-12 sm:h-[52px] rounded-xl font-bold text-base bg-[#1768DB] hover:bg-[#1558BC] text-white transition-all shadow-md mt-2 flex items-center justify-center gap-2"
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
                    <div className="flex-1 h-px bg-[#DFE1E6]" />
                    <span className="text-xs text-[#6B778C] font-medium uppercase tracking-wider">or continue with</span>
                    <div className="flex-1 h-px bg-[#DFE1E6]" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => toast({ title: "Coming Soon", description: "Google OAuth is not yet configured." })}
                      className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-[#DFE1E6] bg-white hover:bg-[#F1F2F4] transition-colors text-sm font-medium text-[#5E6C84]"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                      Google
                    </button>
                    <button type="button"
                      onClick={() => toast({ title: "Coming Soon", description: "Microsoft OAuth is not yet configured." })}
                      className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-[#DFE1E6] bg-white hover:bg-[#F1F2F4] transition-colors text-sm font-medium text-[#5E6C84]"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="2" width="9.6" height="9.6" fill="#F25022" rx="1.5" /><rect x="12.4" y="2" width="9.6" height="9.6" fill="#7FBA00" rx="1.5" /><rect x="2" y="12.4" width="9.6" height="9.6" fill="#00A4EF" rx="1.5" /><rect x="12.4" y="12.4" width="9.6" height="9.6" fill="#FFB900" rx="1.5" /></svg>
                      Microsoft
                    </button>
                  </div>
                </div>
              </div>
            )}
  
            <div className="mt-6 sm:mt-8 text-center">
              {authMode === "signup" ? (
                <p className="text-sm text-[#5E6C84]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => toggleAuthMode("login")}
                    className="font-medium text-[#1768DB] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-sm text-[#5E6C84]">
                  Do not have an account?{" "}
                  <button
                    type="button"
                    onClick={() => toggleAuthMode("signup")}
                    className="font-medium text-[#1768DB] hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

      {/* Footer */}
      <div className="w-full flex flex-col items-center pb-6 z-10">
        <div className="flex items-center gap-3 opacity-40">
          {/* <img src="/brand/logo.svg" alt="Quarterly Reports" className="h-5 w-auto" /> */}
          <span className="text-xs text-[#5E6C84]">&copy; 2026 Quarterly Reports Management System</span>
        </div>
      </div>
    </div>
  );
}
