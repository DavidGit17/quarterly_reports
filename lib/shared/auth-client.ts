export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "coordinator" | "facilitator";
  project?: string;
  deadline?: string;
  profileImage?: string;
};

type MeResponse = {
  user?: SessionUser;
  message?: string;
};

let currentUserPromise: Promise<SessionUser | null> | null = null;

export const clearCurrentUserCache = () => {
  currentUserPromise = null;
};

export const getCurrentUser = async (): Promise<SessionUser | null> => {
  if (!currentUserPromise) {
    currentUserPromise = fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as MeResponse;
        return data.user || null;
      })
      .catch(() => null);
  }

  return currentUserPromise;
};
