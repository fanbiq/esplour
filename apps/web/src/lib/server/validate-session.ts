import { getIronSession, IronSession } from "iron-session";
import { getSessionOptions } from "@/lib/session";
import { SessionData } from "@/types";
import { db, nativeUsers } from "@/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "./mobile-jwt";

function loggedOutSession(sessionCode?: string): IronSession<SessionData> {
  return {
    user: { Id: "", Name: "", DeviceId: "" },
    isLoggedIn: false,
    sessionCode,
    save: async () => {},
    destroy: async () => {},
  } as unknown as IronSession<SessionData>;
}

/**
 * Mobile (React Native) clients don't have a cookie jar wired up by default,
 * so they authenticate with `Authorization: Bearer <accessToken>` instead of
 * the httpOnly session cookie the web app uses. When that header is present
 * we short-circuit straight to a DB-backed lookup and hand back an
 * IronSession-shaped object so every existing route that calls
 * `getValidatedSession()` keeps working unmodified for both clients.
 *
 * Because sessions/matching are keyed off `session.sessionCode`, mobile
 * clients that have joined/created a session should send it back on each
 * request via the `X-Session-Code` header.
 */
async function getBearerSession(authHeader: string): Promise<IronSession<SessionData> | null> {
  const token = authHeader.slice(7).trim();
  const payload = await verifyAccessToken(token);
  if (!payload?.sub) return null;

  const hdrs = await headers();
  const sessionCode = hdrs.get("x-session-code")?.trim().toUpperCase() || undefined;

  // Guests never hit the NativeUser table — trust the signed claims directly.
  if (payload.isGuest) {
    return {
      user: {
        Id: payload.sub,
        Name: payload.name,
        DeviceId: `native-${payload.sub}`,
        isAdmin: false,
        isGuest: true,
        provider: "native",
      },
      isLoggedIn: true,
      sessionCode,
      save: async () => {},
      destroy: async () => {},
    } as unknown as IronSession<SessionData>;
  }

  const user = await db
    .select()
    .from(nativeUsers)
    .where(eq(nativeUsers.id, payload.sub))
    .then((rows: typeof nativeUsers.$inferSelect[]) => rows[0]);

  if (!user || user.sessionVersion !== payload.sessionVersion) {
    // Token was issued for an account that no longer exists, or has since
    // been invalidated (password change / logout-everywhere bumps this).
    return loggedOutSession(sessionCode);
  }

  return {
    user: {
      Id: user.id,
      Name: user.username,
      DisplayName: user.displayName || undefined,
      DeviceId: `native-${user.id}`,
      isAdmin: false,
      provider: "native",
      sessionVersion: user.sessionVersion,
    },
    isLoggedIn: true,
    sessionCode,
    save: async () => {},
    destroy: async () => {},
  } as unknown as IronSession<SessionData>;
}

export async function getValidatedSession(): Promise<IronSession<SessionData>> {
  const hdrs = await headers();
  const authHeader = hdrs.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const bearerSession = await getBearerSession(authHeader);
    // A present-but-invalid/expired Bearer token means "logged out", full
    // stop — we never fall back to cookies for a request that identified
    // itself as a token-auth client.
    return bearerSession ?? loggedOutSession();
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, await getSessionOptions());

  if (!session) {
    throw new Error("Unable to initialize session");
  }

  if (!session.isLoggedIn || !session.user?.Id) {
    session.user = { Id: "", Name: "", DeviceId: "" } as any;
    session.isLoggedIn = false;
    return session;
  }

  if (session.user.sessionVersion === undefined) {
    logger.info(`[ValidateSession] Missing sessionVersion for user ${session.user.Id}`);
    await session.destroy();
    session.user = { Id: "", Name: "", DeviceId: "" } as any;
    session.isLoggedIn = false;
    return session;
  }

  const user = await db
    .select()
    .from(nativeUsers)
    .where(eq(nativeUsers.id, session.user.Id))
    .then((rows: typeof nativeUsers.$inferSelect[]) => rows[0]);

  if (!user) {
    logger.warn(`[ValidateSession] No native user found for session user ${session.user.Id}`);
    await session.destroy();
    session.user = { Id: "", Name: "", DeviceId: "" } as any;
    session.isLoggedIn = false;
    return session;
  }

  if (user.sessionVersion !== session.user.sessionVersion) {
    logger.info(
      `[ValidateSession] Session version mismatch for ${session.user.Id}: cookie=${session.user.sessionVersion} db=${user.sessionVersion}`
    );
    await session.destroy();
    session.user = { Id: "", Name: "", DeviceId: "" } as any;
    session.isLoggedIn = false;
    return session;
  }

  return session as IronSession<SessionData>;
}
