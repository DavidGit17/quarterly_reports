"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "coordinator";
  project?: string;
  profileImage?: string;
};

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { user?: SessionUser };
          if (data.user) setUser(data.user);
        }
      } catch {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    void loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
