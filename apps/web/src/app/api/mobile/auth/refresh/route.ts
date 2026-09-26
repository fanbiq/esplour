import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, nativeUsers } from "@/db";
import { verifyRefreshToken, issueTokenPair } from "@/lib/server/mobile-jwt";
import { handleApiError } from "@/lib/api-utils";

/**
 * Exchanges a still-valid refresh token for a new access/refresh pair
 * ("rotation" — the old refresh token is implicitly retired since the
 * client should discard it in favor of the new one it gets back).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json({ message: "refreshToken is required" }, { status: 400 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload?.sub) {
      return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(nativeUsers)
      .where(eq(nativeUsers.id, payload.sub))
      .then((rows: typeof nativeUsers.$inferSelect[]) => rows[0]);

    if (!user || user.sessionVersion !== payload.sessionVersion) {
      return NextResponse.json({ message: "Session no longer valid, please log in again" }, { status: 401 });
    }

    const tokens = await issueTokenPair(user);

    return NextResponse.json({
      success: true,
      ...tokens,
      user: { Id: user.id, Name: user.username, DeviceId: `native-${user.id}`, isAdmin: false, provider: "native" },
    });
  } catch (error) {
    return handleApiError(error, "Token refresh failed");
  }
}
