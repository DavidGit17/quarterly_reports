"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, type SessionUser } from "@/lib/shared/auth-client";

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
        const currentUser = await getCurrentUser();
        if (currentUser) setUser(currentUser);
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
