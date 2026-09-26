import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { loginSchema } from "@/lib/validations";
import { getClientIp, isRateLimitedKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-utils";
import { db, nativeUsers } from "@/db";
import { issueTokenPair } from "@/lib/server/mobile-jwt";

/**
 * Mobile counterpart of /api/auth/login. Same credential checks, but
 * responds with a JWT access/refresh token pair instead of a Set-Cookie
 * header, since native clients don't have a cookie jar wired up.
 *
 * Only native (email/password) accounts are supported here — OAuth
 * providers should use their own native SDK flow and exchange the resulting
 * identity for tokens via a dedicated endpoint if/when that's added.
 */
export async function POST(request: NextRequest) {
  let usernameForLog = "unknown";

  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { username, password } = validated.data;
    usernameForLog = username;
    console.log("[mobile login debug] incoming body", { username, passwordProvided: !!password, provider: body.provider });

    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const ip = getClientIp(request);
    const ipLimit = isRateLimitedKey(`ip:${ip}`, 30, 60_000);
    if (ipLimit.limited) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }

    const acctKey = `acct:${username.toLowerCase().trim()}`;
    const acctLimit = isRateLimitedKey(acctKey, 5, 60_000);
    if (acctLimit.limited) {
      return NextResponse.json(
        { message: "Too many attempts for this account" },
        { status: 429, headers: { "Retry-After": String(acctLimit.retryAfter) } }
      );
    }

    const user = await db
      .select()
      .from(nativeUsers)
      .where(or(eq(nativeUsers.email, username.toLowerCase().trim()), eq(nativeUsers.username, username)))
      .then((r: typeof nativeUsers.$inferSelect[]) => r[0]);

    console.log("[mobile login debug] user lookup", {
      username,
      matchedUser: user ? { id: user.id, email: user.email, username: user.username, verified: user.isVerified } : null,
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (!user.passwordHash || user.passwordHash.trim() === "") {
      return NextResponse.json(
        { message: "This account was created with Google or another social sign-in. Please use the web app or create a native password first." },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Email not verified. Check your inbox.", userId: user.id, needsVerification: true },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);

    logger.info(`[Mobile Auth] Login success: ${user.username}`);

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        Id: user.id,
        Name: user.username,
        DisplayName: user.displayName || undefined,
        DeviceId: `native-${user.id}`,
        isAdmin: false,
        provider: "native",
      },
    });
  } catch (error) {
    logger.warn(`[Mobile Auth] Login failed for ${usernameForLog}:`, error instanceof Error ? error.message : error);
    return handleApiError(error, "Login failed");
  }
}
