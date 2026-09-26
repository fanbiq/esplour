import { NextRequest, NextResponse } from "next/server";
import { guestLoginSchema } from "@/lib/validations";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { SessionService } from "@/lib/services/session-service";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-utils";
import { signAccessToken } from "@/lib/server/mobile-jwt";

/**
 * Mobile counterpart of /api/auth/guest. Guests aren't NativeUser rows, so
 * there's no refresh token here — just a short-lived (24h) access token tied
 * to the synthetic guest id `SessionService.loginGuest` hands back. Re-join
 * with the same session code if the token expires mid-session.
 */
export async function POST(request: NextRequest) {
  const { capabilities } = getRuntimeConfig();
  try {
    const body = await request.json();
    const validated = guestLoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { username, sessionCode } = validated.data;

    const { user, code } = await SessionService.loginGuest(username, sessionCode, capabilities);

    const accessToken = await signAccessToken(
      {
        sub: user.Id,
        name: user.Name,
        sessionVersion: 0,
        isGuest: true,
      },
      "24h"
    );

    logger.info(`[Mobile Auth] Guest joined session ${code}: ${username}`);

    return NextResponse.json({
      success: true,
      accessToken,
      sessionCode: code,
      user: { Id: user.Id, Name: user.Name, DeviceId: `native-${user.Id}`, isGuest: true, provider: "native" },
    });
  } catch (error: any) {
    const status =
      error.message === "Session not found" ? 404 : error.message === "This session does not allow guest lending" ? 403 : 500;

    if (status === 500) {
      return handleApiError(error, "Failed to join as guest");
    }

    return NextResponse.json({ message: error.message || "Failed to join as guest" }, { status });
  }
}
