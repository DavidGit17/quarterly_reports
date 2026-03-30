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
let ensureUsersIndexesPromise: Promise<void> | null = null;

const ensureUsersIndexes = async (
  usersCollection: Collection<UserDocument>,
) => {
  if (!ensureUsersIndexesPromise) {
    ensureUsersIndexesPromise = usersCollection
      .createIndexes([
        {
          key: { usernameLower: 1 },
          name: "users_username_lower_idx",
        },
        {
          key: { emailLower: 1 },
          name: "users_email_lower_idx",
        },
        {
          key: { sessionToken: 1, sessionExpiresAt: 1 },
          name: "users_session_lookup_idx",
        },
      ])
      .then(() => undefined);
  }

  await ensureUsersIndexesPromise;
};

export const getUsersCollection = async (): Promise<
  Collection<UserDocument>
> => {
  const db = await getDb();
  const usersCollection = db.collection<UserDocument>(USERS_COLLECTION);
  await ensureUsersIndexes(usersCollection);
  return usersCollection;
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
