import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import { getAuthTokenFromCookies, verifyAuthToken } from "@/server/auth/jwt";
import { getFormDistributionCollection } from "@/server/form-distribution/form-distribution";

export type UserRole = "coordinator" | "facilitator" | "admin";
export type UserStatus = "active" | "inactive";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  project?: string;
  deadline?: string;
  profileImage?: string;
};

export const ADMIN_USERNAMES = ["admin", "reports"] as const;
export const MAX_ADMIN_ACCOUNTS = 2;

export type UserDocument = {
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  project?: string;
  profileImage?: string;
  createdAt: Date;
};

export type UserRecord = WithId<UserDocument> & { _id: ObjectId };

const USERS_COLLECTION = "users";

const ensureUsersIndexes = async () => {};

export const getUsersCollection = async (): Promise<
  Collection<UserDocument>
> => {
  const db = await getDb();
  const usersCollection = db.collection<UserDocument>(USERS_COLLECTION);
  await ensureUsersIndexes();
  return usersCollection;
};

export const toSessionUser = async (user: UserRecord): Promise<SessionUser> => {
  let deadline: string | undefined;
  if (user.project) {
    try {
      const collection = await getFormDistributionCollection();
      const rule = await collection.findOne(
        { projects: user.project, status: "active" },
        { sort: { createdAt: -1 } },
      );
      if (rule?.deadline) {
        deadline = rule.deadline;
      }
    } catch {
      /* ignore */
    }
  }
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status || "active",
    project: user.project,
    deadline,
    profileImage: user.profileImage,
  };
};

export const getAuthenticatedUser = async (): Promise<SessionUser | null> => {
  const authToken = await getAuthTokenFromCookies();

  if (!authToken) {
    return null;
  }

  const payload = await verifyAuthToken(authToken);

  if (!payload) {
    return null;
  }

  const usersCollection = await getUsersCollection();

  let userId: ObjectId;

  try {
    userId = new ObjectId(payload.sub);
  } catch {
    return null;
  }

  const user = await usersCollection.findOne({
    _id: userId,
  });

  if (!user) {
    return null;
  }

  return toSessionUser(user);
};

export const requireActiveUser = async (): Promise<{
  user: SessionUser | null;
  error: { message: string; status: number } | null;
}> => {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return { user: null, error: { message: "Unauthorized.", status: 401 } };
  }

  if (currentUser.status !== "active") {
    return {
      user: null,
      error: {
        message:
          "Your account is currently inactive. Please contact administrator.",
        status: 403,
      },
    };
  }

  return { user: currentUser, error: null };
};

export const requireAdmin = async (): Promise<{
  user: SessionUser;
  error: { message: string; status: number } | null;
}> => {
  const { user, error } = await requireActiveUser();

  if (error || !user) {
    return { user: null as unknown as SessionUser, error };
  }

  if (user.role !== "admin") {
    return {
      user: null as unknown as SessionUser,
      error: { message: "Forbidden.", status: 403 },
    };
  }

  return { user, error: null };
};
