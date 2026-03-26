"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserRole = "admin" | "coordinator";

type SessionUser = {
  username: string;
  email: string;
  role: UserRole;
};

function ProfileContent() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSessionUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = (await response.json()) as { user?: SessionUser };

        if (!data.user) {
          router.push("/login");
          return;
        }

        setSessionUser(data.user);
      } catch {
        setErrorMessage("Unable to load profile.");
      } finally {
        setIsHydrated(true);
      }
    };

    void loadSessionUser();
  }, [router]);

  const role: UserRole = sessionUser?.role || "coordinator";

  const profileData =
    role === "admin"
      ? {
          username: sessionUser?.username || "Admin",
          email: sessionUser?.email || "-",
          roleLabel: "Administrator",
          description:
            "You have full access to all reports and can manage the system.",
          destinationHref: "/dashboard",
          destinationLabel: "Go to Dashboard",
        }
      : {
          username: sessionUser?.username || "Coordinator",
          email: sessionUser?.email || "-",
          roleLabel: "Coordinator",
          description: "You can submit and view your quarterly reports.",
          destinationHref: "/select",
          destinationLabel: "Go to Reports",
        };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-border p-8 text-muted-foreground">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-secondary hover:underline"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-primary">Profile</h1>
        </div>

        <div className="bg-white rounded-lg border border-border p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Username
              </label>
              <div className="px-4 py-3 bg-muted rounded-lg text-foreground">
                {profileData.username}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Email
              </label>
              <div className="px-4 py-3 bg-muted rounded-lg text-foreground">
                {profileData.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Role
              </label>
              <div className="px-4 py-3 bg-muted rounded-lg text-foreground capitalize">
                {profileData.roleLabel}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                {profileData.description}
              </p>
              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Link
                href={profileData.destinationHref}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors text-center"
              >
                {profileData.destinationLabel}
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}
