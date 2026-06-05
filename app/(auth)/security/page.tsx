"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, UserCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export default function SecurityPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password must match.");
      return;
    }

    setSuccessMessage(
      "Password change request is ready. Backend integration can be added next.",
    );
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#5E6C84] hover:text-[#172B4D] mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-lg border border-[#DFE1E6] bg-white overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
            <aside className="border-b md:border-b-0 md:border-r border-[#DFE1E6] bg-[#F1F2F4] p-4">
              <h1 className="text-3xl font-semibold text-[#172B4D] mb-1">
                Account
              </h1>
              <p className="text-sm text-[#5E6C84] mb-5">
                Manage your account info.
              </p>

              <nav className="space-y-1">
                <Link
                  href="/profile"
                  className="w-full rounded-lg px-3 py-2 text-sm text-[#5E6C84] font-medium flex items-center gap-2 hover:bg-[#F1F2F4]"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Profile
                </Link>
                <button className="w-full rounded-lg bg-[#DFE1E6] px-3 py-2 text-sm text-[#172B4D] font-medium flex items-center gap-2 justify-start">
                  <Shield className="h-4 w-4" />
                  Security
                </button>
              </nav>
            </aside>

            <main>
              <div className="max-w-3xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-semibold text-[#172B4D] mb-5">
                  Security
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="border border-[#DFE1E6] rounded-lg bg-white p-4 space-y-4"
                >
                  <div>
                    <label
                      className="block text-sm text-[#5E6C84] mb-1"
                      htmlFor="current-password"
                    >
                      Current password
                    </label>
                    <PasswordInput
                      id="current-password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm text-[#5E6C84] mb-1"
                      htmlFor="new-password"
                    >
                      New password
                    </label>
                    <PasswordInput
                      id="new-password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm text-[#5E6C84] mb-1"
                      htmlFor="confirm-password"
                    >
                      Confirm password
                    </label>
                    <PasswordInput
                      id="confirm-password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  )}

                  {successMessage && (
                    <p className="text-sm text-emerald-700">{successMessage}</p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="default"
                      className="bg-[#1768DB] hover:bg-[#113263] w-full sm:w-auto"
                    >
                      Update password
                    </Button>
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
