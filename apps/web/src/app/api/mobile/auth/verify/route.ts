import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, desc, sql } from "drizzle-orm";
import { db, nativeUsers, verificationTokens } from "@/db";
import { verifyOtpSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-utils";
import { issueTokenPair } from "@/lib/server/mobile-jwt";

/** Mobile counterpart of /api/auth/verify — confirms the OTP and returns tokens. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifyOtpSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { userId, otp } = validated.data;

    const user = await db
      .select()
      .from(nativeUsers)
      .where(eq(nativeUsers.id, userId))
      .then((r: typeof nativeUsers.$inferSelect[]) => r[0]);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      const { accessToken, refreshToken } = await issueTokenPair(user);
      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken,
        user: { Id: user.id, Name: user.username, DeviceId: `native-${user.id}`, isAdmin: false, provider: "native" },
      });
    }

    const tokenRow = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.userId, userId))
      .orderBy(desc(verificationTokens.createdAt))
      .limit(1)
      .then((r: typeof verificationTokens.$inferSelect[]) => r[0]);

    if (!tokenRow) {
      return NextResponse.json({ message: "No verification code found. Request a new one." }, { status: 400 });
    }

    if (new Date(tokenRow.expiresAt) < new Date()) {
      return NextResponse.json({ message: "Verification code has expired. Request a new one." }, { status: 400 });
    }

    const valid = await bcrypt.compare(otp, tokenRow.token);
    if (!valid) {
      await db
        .update(verificationTokens)
        .set({ attempts: sql`${verificationTokens.attempts} + 1` })
        .where(eq(verificationTokens.id, tokenRow.id));

      const refreshed = await db
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.id, tokenRow.id))
        .then((r: typeof verificationTokens.$inferSelect[]) => r[0]);

      if (!refreshed || refreshed.attempts >= 5) {
        await db.delete(verificationTokens).where(eq(verificationTokens.id, tokenRow.id));
        return NextResponse.json({ message: "Verification code locked due to too many incorrect attempts" }, { status: 401 });
      }

      return NextResponse.json({ message: "Incorrect verification code" }, { status: 401 });
    }

    await db
      .update(nativeUsers)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(nativeUsers.id, userId));

    await db.delete(verificationTokens).where(eq(verificationTokens.userId, userId));

    const freshUser = { ...user, isVerified: true };
    const { accessToken, refreshToken } = await issueTokenPair(freshUser);

    logger.info(`[Mobile Auth] Verification success: ${user.username}`);

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: { Id: user.id, Name: user.username, DeviceId: `native-${user.id}`, isAdmin: false, provider: "native" },
    });
  } catch (error) {
    return handleApiError(error, "Verification failed");
  }
}
