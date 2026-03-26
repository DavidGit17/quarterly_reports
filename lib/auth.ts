import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSessionTokenFromCookies } from "@/lib/session";

export type UserRole = "coordinator" | "admin";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
};

export type UserDocument = {
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  sessionToken?: string;
  sessionExpiresAt?: Date;
};

export type UserRecord = WithId<UserDocument> & { _id: ObjectId };

const USERS_COLLECTION = "users";

export const getUsersCollection = async (): Promise<
  Collection<UserDocument>
> => {
  const db = await getDb();
  return db.collection<UserDocument>(USERS_COLLECTION);
};

export const toSessionUser = (user: UserRecord): SessionUser => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  role: user.role,
});

export const getAuthenticatedUser = async (): Promise<SessionUser | null> => {
  const sessionToken = await getSessionTokenFromCookies();

  if (!sessionToken) {
    return null;
  }

  const usersCollection = await getUsersCollection();

  const user = await usersCollection.findOne({
    sessionToken,
    sessionExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return null;
  }

  return toSessionUser(user);
};
