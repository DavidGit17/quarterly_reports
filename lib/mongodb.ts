import { MongoClient, Db, MongoServerError, MongoNetworkError } from "mongodb";

const MISSING_MONGODB_URI_MESSAGE = "Missing MONGODB_URI environment variable";
const PLACEHOLDER_MONGODB_URI_MESSAGE =
  "MONGODB_URI contains placeholder tokens";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const dbName = process.env.MONGODB_DB_NAME || "quarterly_reports";

const getClientPromise = () => {
  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(MISSING_MONGODB_URI_MESSAGE);
  }

  if (/[<>]/.test(uri)) {
    throw new Error(PLACEHOLDER_MONGODB_URI_MESSAGE);
  }

  const client = new MongoClient(uri);
  const clientPromise = client.connect();

  if (process.env.NODE_ENV !== "production") {
    global._mongoClientPromise = clientPromise;
  }

  return clientPromise;
};

export const getDb = async (): Promise<Db> => {
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
};

export const isMongoConfigurationError = (error: unknown) =>
  error instanceof Error &&
  [MISSING_MONGODB_URI_MESSAGE, PLACEHOLDER_MONGODB_URI_MESSAGE].includes(
    error.message,
  );

export const getMongoRouteErrorResponse = (error: unknown) => {
  if (isMongoConfigurationError(error)) {
    if (
      error instanceof Error &&
      error.message === PLACEHOLDER_MONGODB_URI_MESSAGE
    ) {
      return {
        status: 503,
        message:
          "MONGODB_URI still has placeholders. Replace <username>, <password>, <cluster-url>, and <db> in .env.local and restart the app.",
      };
    }

    return {
      status: 503,
      message:
        "Server is not configured yet. Set MONGODB_URI in .env.local and restart the app.",
    };
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    return {
      status: 409,
      message: "Username or email already exists.",
    };
  }

  const errorMessage = error instanceof Error ? error.message : "";
  const messageLower = errorMessage.toLowerCase();
  const mongoErrorCode =
    error instanceof MongoServerError && typeof error.code === "number"
      ? error.code
      : null;

  const hasAuthenticationError =
    (mongoErrorCode !== null && [13, 18, 8000].includes(mongoErrorCode)) ||
    messageLower.includes("authentication failed") ||
    messageLower.includes("bad auth") ||
    messageLower.includes("auth failed");

  if (hasAuthenticationError) {
    return {
      status: 503,
      message:
        "Database authentication failed. Verify MongoDB username/password in MONGODB_URI and ensure special characters are URL-encoded.",
    };
  }

  const hasNetworkError =
    error instanceof MongoNetworkError ||
    messageLower.includes("enotfound") ||
    messageLower.includes("etimedout") ||
    messageLower.includes("econnrefused") ||
    messageLower.includes("querysrv") ||
    messageLower.includes("dns");

  if (hasNetworkError) {
    return {
      status: 503,
      message:
        "Cannot connect to MongoDB. Check cluster hostname/network access and confirm your IP is allowed in Atlas.",
    };
  }

  const hasInvalidUriError =
    messageLower.includes("invalid scheme") ||
    messageLower.includes("mongodb connection string") ||
    messageLower.includes("uri malformed");

  if (hasInvalidUriError) {
    return {
      status: 503,
      message:
        "MONGODB_URI appears invalid. Use a full mongodb+srv://... URI from MongoDB Atlas.",
    };
  }

  return null;
};
