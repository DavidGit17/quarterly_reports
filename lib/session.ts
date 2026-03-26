import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const SESSION_COOKIE_NAME = "qr_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const createSessionToken = () => randomBytes(32).toString("hex");

export const getSessionTokenFromCookies = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
};
