import { Collection, ObjectId, WithId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import { getAuthTokenFromCookies, verifyAuthToken } from "@/server/auth/jwt";

export type UserRole = "coordinator" | "admin";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  project?: string;
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
  project?: string;
  profileImage?: string;
  createdAt: Date;
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
  project: user.project,
  profileImage: user.profileImage,
});

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
