import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "qr_session";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type AuthJwtPayload = {
  sub: string; // user _id
};

const getJwtSecret = (): string => {
  const configuredSecret =
    process.env.AUTH_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (configuredSecret) return configuredSecret;
  throw new Error("Missing JWT secret. Set AUTH_JWT_SECRET.");
};

const getSecretKey = () => new TextEncoder().encode(getJwtSecret());

export const createAuthToken = async (userId: string) =>
  new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

export const verifyAuthToken = async (
  token: string,
): Promise<AuthJwtPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.sub !== "string") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
};

export const getAuthTokenFromCookies = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
};
