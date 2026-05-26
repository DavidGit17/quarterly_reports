"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toProjectSlug } from "@/lib/shared/form-storage";

type MeResponse = {
  user?: {
    role: "admin" | "coordinator" | "facilitator";
    status?: "active" | "inactive";
    project?: string;
  };
};

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const routeUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = (await response.json()) as MeResponse;

        if (data.user?.status === "inactive") {
          router.push("/login");
          return;
        }

        if (data.user?.role === "admin") {
          router.push("/dashboard");
          return;
        }

        if (!data.user?.project) {
          router.push("/login");
          return;
        }

        const formPrefix = data.user.role === "facilitator" ? "/f" : "";
        router.push(`${formPrefix}/form/${toProjectSlug(data.user.project)}`);
      } catch {
        router.push("/login");
      }
    };

    void routeUser();
  }, [router]);

  return null;
}
