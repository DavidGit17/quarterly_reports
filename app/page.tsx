"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type MeResponse = {
  user?: {
    role: "admin" | "coordinator";
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

        if (data.user?.role === "admin") {
          router.push("/dashboard");
          return;
        }

        router.push("/select");
      } catch {
        router.push("/login");
      }
    };

    void routeUser();
  }, [router]);

  return null;
}
