import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { getAuthSecret } from "./session-secret";

/**
 * Token-based auth for native mobile clients (React Native / Expo, etc).
 *
 * This sits *alongside* the existing cookie/iron-session auth used by the
 * web app — it does not replace it. Web keeps using httpOnly cookies.
 * Mobile clients authenticate with a Bearer access token (short-lived) and
 * use a refresh token (long-lived) to mint new access tokens.
 *
 * Access tokens embed `sessionVersion` (already used by the cookie flow to
 * invalidate sessions on password change / logout-everywhere) so revocation
 * is free: bump NativeUser.sessionVersion and every outstanding token for
 * that user — cookie or bearer — stops working the moment it's checked
 * against the DB.
 */

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

export interface MobileAccessTokenPayload extends JWTPayload {
  sub: string; // NativeUser.id
  name: string; // username
  sessionVersion: number;
  isAdmin?: boolean;
  isGuest?: boolean;
  type: "access";
}

export interface MobileRefreshTokenPayload extends JWTPayload {
  sub: string;
  sessionVersion: number;
  type: "refresh";
}

async function getSecretKey(): Promise<Uint8Array> {
  const secret = await getAuthSecret();
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: Omit<MobileAccessTokenPayload, "type">,
  expiresIn: string = ACCESS_TOKEN_TTL
): Promise<string> {
  const key = await getSecretKey();
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function signRefreshToken(payload: Omit<MobileRefreshTokenPayload, "type">): Promise<string> {
  const key = await getSecretKey();
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(key);
}

export async function verifyAccessToken(token: string): Promise<MobileAccessTokenPayload | null> {
  try {
    const key = await getSecretKey();
    const { payload } = await jwtVerify(token, key);
    if (payload.type !== "access") return null;
    return payload as MobileAccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<MobileRefreshTokenPayload | null> {
  try {
    const key = await getSecretKey();
    const { payload } = await jwtVerify(token, key);
    if (payload.type !== "refresh") return null;
    return payload as MobileRefreshTokenPayload;
  } catch {
    return null;
  }
}

export async function issueTokenPair(user: { id: string; username: string; sessionVersion: number; isAdmin?: boolean }) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, name: user.username, sessionVersion: user.sessionVersion, isAdmin: !!user.isAdmin }),
    signRefreshToken({ sub: user.id, sessionVersion: user.sessionVersion }),
  ]);
  return { accessToken, refreshToken };
}
