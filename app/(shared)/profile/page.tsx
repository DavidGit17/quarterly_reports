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
import { Camera, UserCircle2 } from "lucide-react";

type UserRole = "admin" | "coordinator";

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
          roleLabel: "Coordinator",
          description: "You can submit and view your quarterly reports.",
          destinationHref: sessionUser?.project
            ? `/form/${toProjectSlug(sessionUser.project)}`
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
    <div
      className={`${role === "coordinator" ? "coordinator-system" : ""} min-h-screen bg-background p-3 md:p-5`}
    >
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.replace(profileData.destinationHref);
            }
          }}
          className="mb-4 inline-flex items-center gap-1 font-ui text-[14px] font-medium leading-5 text-secondary transition-colors hover:text-foreground"
          aria-label="Go back"
          title="Back"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>

        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
            <aside className="border-r border-border bg-[var(--surface-container-low)] p-5">
              <h1 className="mb-1 font-heading text-[20px] font-medium leading-7 text-foreground">
                Account
              </h1>
              <p className="mb-5 font-ui text-[14px] leading-5 text-muted-foreground">
                Manage your account info.
              </p>

              <nav className="space-y-1">
                <Link
                  href="/profile"
                  className="flex w-full items-center gap-2 rounded border border-[var(--outline)] bg-[var(--surface-container-highest)] px-3 py-2 font-ui text-[14px] font-medium leading-5 text-foreground"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Profile
                </Link>
              </nav>
            </aside>

            <main>
              <div className="mx-auto max-w-2xl px-5 py-6">
                <div className="mb-4">
                  <h2 className="font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-foreground">
                    Profile details
                  </h2>
                  <p className="mt-1 font-ui text-[14px] leading-5 text-muted-foreground">
                    Keep your identity and access details up to date.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-border p-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={openUpdateModal}
                        className="group relative"
                        aria-label="Update profile image"
                      >
                        <Avatar className="h-11 w-11 border border-border">
                          {profileImagePreview ? (
                            <AvatarImage
                              src={profileImagePreview}
                              alt="Profile image"
                            />
                          ) : null}
                          <AvatarFallback className="bg-[var(--surface-container-highest)] text-secondary font-ui text-[14px] font-semibold leading-5">
                            {getUserInitials(profileData.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Camera className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>

                      <div>
                        <p className="font-ui text-[14px] font-semibold leading-5 text-foreground">
                          {profileData.username}
                        </p>
                        <p className="font-ui text-[14px] leading-5 text-muted-foreground">
                          {profileData.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openUpdateModal}
                      className="h-8 border-[var(--outline)] px-3 font-ui text-[12px] font-medium leading-4 text-secondary hover:bg-background"
                    >
                      Edit Profile
                    </Button>
                  </div>

                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-[110px_1fr] items-center px-4 py-2.5 text-sm">
                      <span className="font-ui text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </span>
                      <span className="text-right font-medium text-foreground">
                        {profileData.email}
                      </span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] items-center px-4 py-2.5 text-sm">
                      <span className="font-ui text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                        Role
                      </span>
                      <span className="text-right font-medium text-foreground">
                        {profileData.roleLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] items-center px-4 py-2.5 text-sm">
                      <span className="font-ui text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                        Project
                      </span>
                      <span className="text-right font-medium text-foreground">
                        {profileData.project}
                      </span>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <p className="font-ui text-[14px] leading-5 text-[#ba1a1a] mt-3">{errorMessage}</p>
                )}

                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                  <Link
                    href={profileData.destinationHref}
                    className="inline-flex h-8 items-center whitespace-nowrap rounded bg-primary px-3 font-ui text-[12px] font-medium leading-4 text-primary-foreground transition-colors hover:bg-[var(--primary)]/90"
                  >
                    {profileData.destinationLabel}
                  </Link>
                  {role === "coordinator" && (
                    <Link
                      href="/my-reports"
                      className="inline-flex h-8 items-center whitespace-nowrap rounded border border-[var(--outline)] bg-white px-3 font-ui text-[12px] font-medium leading-4 text-secondary hover:bg-[var(--surface-container-low)]"
                    >
                      View My Reports
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="inline-flex h-8 items-center whitespace-nowrap rounded border border-[#ffdad6] bg-white px-3 font-ui text-[12px] font-medium leading-4 text-[#ba1a1a] hover:bg-[#ffdad6]/45"
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
            className="max-w-xl rounded-lg border border-border bg-white p-0"
            showCloseButton={false}
          >
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="font-heading text-[30px] font-semibold leading-10 tracking-[-0.02em] text-foreground">
                  Update profile
                </DialogTitle>
              </DialogHeader>

              <div className="mt-5 rounded-lg border border-border bg-[var(--surface-container-low)] p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-border">
                    {uploadImage || draftImage ? (
                      <AvatarImage
                        src={uploadImage || draftImage}
                        alt="Draft profile image"
                      />
                    ) : null}
                    <AvatarFallback className="bg-[var(--surface-container-highest)] text-secondary font-ui text-[16px] font-semibold leading-6">
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
                      <span className="inline-flex cursor-pointer items-center rounded border border-[var(--outline)] bg-white px-4 py-2 font-ui text-[14px] font-medium leading-5 text-secondary hover:bg-background">
                        Upload
                      </span>
                    </label>

                    {(uploadImage || draftImage) && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="font-ui text-[14px] font-medium leading-5 text-[#ba1a1a] hover:text-[#ba1a1a]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <p className="font-ui text-[14px] leading-5 text-muted-foreground">
                  Recommended size 1:1, up to 10MB.
                </p>

                {uploadImage && (
                  <div className="space-y-3">
                    <div className="relative h-56 w-full overflow-hidden rounded-lg border border-border bg-black/5">
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
                      <label className="mb-1 block font-ui text-[12px] font-medium leading-4 text-secondary">
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
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveProfileImage}
                    disabled={isSavingImage}
                    className="bg-primary hover:bg-[var(--primary)]/90"
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
