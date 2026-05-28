"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper, { type Area } from "react-easy-crop";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toProjectSlug } from "@/lib/shared/form-storage";
import { ArrowLeft, Camera, UserCircle2 } from "lucide-react";

type UserRole = "admin" | "coordinator" | "facilitator";

type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  project?: string;
  profileImage?: string;
};


const createImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });

const getCroppedImageDataUrl = async (imageSrc: string, cropArea: Area) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const cropSize = Math.min(cropArea.width, cropArea.height);

  canvas.width = cropSize;
  canvas.height = cropSize;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to initialize canvas context");
  }

  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropSize,
    cropSize,
    0,
    0,
    cropSize,
    cropSize,
  );

  return canvas.toDataURL("image/jpeg", 0.95);
};

const getUserInitials = (username: string) => {
  const parts = username.trim().split(/\s+/);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

function ProfileContent() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftImage, setDraftImage] = useState("");
  const [uploadImage, setUploadImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);

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
        setProfileImagePreview(data.user.profileImage || "");
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
          project: sessionUser?.project || "All Projects",
          roleLabel: "Administrator",
          description:
            "You have full access to all reports and can manage the system.",
          destinationHref: "/dashboard",
          destinationLabel: "Go to Dashboard",
        }
      : {
          username: sessionUser?.username || "Coordinator",
          email: sessionUser?.email || "-",
          project: sessionUser?.project || "-",
          roleLabel: role === "facilitator" ? "Facilitator" : "Coordinator",
          description: "You can submit and view your quarterly reports.",
          destinationHref: sessionUser?.project
            ? `/${role === "facilitator" ? "f/" : ""}form/${toProjectSlug(sessionUser.project)}`
            : "/profile",
          destinationLabel: "Go to Assigned Form",
        };

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image must be 10MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === "string" ? reader.result : "";

      if (!imageData) {
        return;
      }

      setUploadImage(imageData);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setErrorMessage("");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const openUpdateModal = () => {
    setIsModalOpen(true);
    setDraftImage(profileImagePreview);
    setUploadImage("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCropComplete = (_: Area, croppedArea: Area) => {
    setCroppedAreaPixels(croppedArea);
  };

  const handleRemoveImage = () => {
    setUploadImage("");
    setDraftImage("");
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setUploadImage("");
    setDraftImage(profileImagePreview);
    setErrorMessage("");
  };

  const handleSaveProfileImage = async () => {
    if (!sessionUser?.id) {
      return;
    }

    try {
      setIsSavingImage(true);

      let nextImage = draftImage;

      if (uploadImage && croppedAreaPixels) {
        nextImage = await getCroppedImageDataUrl(
          uploadImage,
          croppedAreaPixels,
        );
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage: nextImage }),
      });

      if (!res.ok) {
        const err = (await res.json()).message || "Failed to save.";
        setErrorMessage(err);
        return;
      }

      setProfileImagePreview(nextImage);
      setIsModalOpen(false);
      setUploadImage("");
      setErrorMessage("");
    } catch {
      setErrorMessage("Unable to update profile image.");
    } finally {
      setIsSavingImage(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
            <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
            <div className="h-4 w-48 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const dashboardHref = role === "facilitator" ? "/f" : "/";

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle at top left, #DFF7E8 0%, transparent 45%),
          radial-gradient(circle at center, #CFF6F2 0%, transparent 55%),
          radial-gradient(circle at bottom left, #BFE8FF 0%, transparent 50%),
          linear-gradient(135deg, #EAFDFF 0%, #D8F7FF 45%, #F8FEFF 100%)
        `,
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-10">
        <button
          type="button"
          onClick={() => router.push(dashboardHref)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#5e6a6e] transition-colors hover:text-[#4b6358]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
            <aside className="border-r border-slate-100 bg-[#f8fafc] p-6">
              <h1 className="mb-1 font-heading text-[20px] font-semibold leading-7 text-[#1a1c1e]">
                Account
              </h1>
              <p className="mb-6 text-sm text-[#5e6a6e]">
                Manage your account info.
              </p>

              <nav className="space-y-1">
                <Link
                  href="/profile"
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#1a1c1e] shadow-sm"
                >
                  <UserCircle2 className="h-4 w-4 text-[#4b6358]" />
                  Profile
                </Link>
              </nav>
            </aside>

            <main>
              <div className="mx-auto max-w-2xl px-6 py-8">
                <div className="mb-6">
                  <h2 className="font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#1a1c1e]">
                    Profile details
                  </h2>
                  <p className="mt-1 text-sm text-[#5e6a6e]">
                    Keep your identity and access details up to date.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={openUpdateModal}
                        className="group relative"
                        aria-label="Update profile image"
                      >
                        <Avatar className="h-11 w-11 border border-slate-200">
                          {profileImagePreview ? (
                            <AvatarImage
                              src={profileImagePreview}
                              alt="Profile image"
                            />
                          ) : null}
                          <AvatarFallback className="bg-[#e8f5ee] text-sm font-semibold text-[#4b6358]">
                            {getUserInitials(profileData.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Camera className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>

                      <div>
                        <p className="text-sm font-semibold text-[#1a1c1e]">
                          {profileData.username}
                        </p>
                        <p className="text-sm text-[#5e6a6e]">
                          {profileData.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openUpdateModal}
                      className="h-8 rounded-xl border-slate-200 px-3 text-xs font-medium text-[#5e6a6e] hover:bg-slate-50"
                    >
                      Edit Profile
                    </Button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-[110px_1fr] items-center px-4 py-3 text-sm">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#424845]">
                        Email
                      </span>
                      <span className="text-right font-medium text-[#1a1c1e]">
                        {profileData.email}
                      </span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] items-center px-4 py-3 text-sm">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#424845]">
                        Role
                      </span>
                      <span className="text-right font-medium text-[#1a1c1e]">
                        {profileData.roleLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] items-center px-4 py-3 text-sm">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#424845]">
                        Project
                      </span>
                      <span className="text-right font-medium text-[#1a1c1e]">
                        {profileData.project}
                      </span>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
                )}

                <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
                  <Link
                    href={profileData.destinationHref}
                    className="inline-flex h-9 items-center whitespace-nowrap rounded-xl bg-[#4b6358] px-4 text-xs font-medium text-white transition-colors hover:bg-[#344b41]"
                  >
                    {profileData.destinationLabel}
                  </Link>
                  {role !== "admin" && (
                    <Link
                      href={role === "facilitator" ? "/f/my-reports" : "/my-reports"}
                      className="inline-flex h-9 items-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-[#5e6a6e] transition-colors hover:bg-slate-50"
                    >
                      View My Reports
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="inline-flex h-9 items-center whitespace-nowrap rounded-xl border border-[#ffdad6] bg-white px-4 text-xs font-medium text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/45"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="max-w-xl rounded-2xl border border-slate-100 bg-white p-0 shadow-sm"
            showCloseButton={false}
          >
            <div className="p-8">
              <DialogHeader>
                <DialogTitle className="font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#1a1c1e]">
                  Update profile
                </DialogTitle>
              </DialogHeader>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-[#f8fafc] p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-slate-200">
                    {uploadImage || draftImage ? (
                      <AvatarImage
                        src={uploadImage || draftImage}
                        alt="Draft profile image"
                      />
                    ) : null}
                    <AvatarFallback className="bg-[#e8f5ee] text-base font-semibold text-[#4b6358]">
                      {getUserInitials(profileData.username)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex items-center gap-3">
                    <label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <span className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#5e6a6e] transition-colors hover:bg-slate-50">
                        Upload
                      </span>
                    </label>

                    {(uploadImage || draftImage) && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-sm font-medium text-[#ba1a1a] hover:text-[#ba1a1a]/80"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#5e6a6e]">
                  Recommended size 1:1, up to 10MB.
                </p>

                {uploadImage && (
                  <div className="space-y-3">
                    <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-200 bg-black/5">
                      <Cropper
                        image={uploadImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={handleCropComplete}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#5e6a6e]">
                        Zoom
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(event) =>
                          setZoom(Number(event.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelModal}
                    className="rounded-xl text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveProfileImage}
                    disabled={isSavingImage}
                    className="rounded-xl bg-[#4b6358] text-sm text-white transition-colors hover:bg-[#344b41]"
                  >
                    {isSavingImage ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
