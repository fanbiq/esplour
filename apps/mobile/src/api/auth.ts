import { api } from "./client";
import { tokenStorage } from "./tokenStorage";
import type { AuthUser } from "@/types/auth";

interface TokenResponse {
  success: true;
  accessToken: string;
  refreshToken?: string;
  sessionCode?: string;
  user: AuthUser;
}

export const authApi = {
  async login(username: string, password: string) {
    const { data } = await api.post<TokenResponse>("/mobile/auth/login", { username, password, provider: "native" }, {
      timeout: 60_000,
    });
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  /** Same endpoint the web app uses — it only creates the row + sends an OTP email, no cookies involved. */
  async register(email: string, username: string, password: string) {
    const { data } = await api.post<{ success: true; userId: string }>("/auth/register", { email, username, password });
    return data;
  },

  async verifyOtp(userId: string, otp: string) {
    const { data } = await api.post<TokenResponse>("/mobile/auth/verify", { userId, otp });
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  /** Same as web — sends a fresh OTP, doesn't touch session state. */
  async resendVerification(userId: string) {
    await api.post("/auth/resend-verification", { userId });
  },

  async joinAsGuest(username: string, sessionCode?: string) {
    const { data } = await api.post<TokenResponse>("/mobile/auth/guest", { username, sessionCode });
    await tokenStorage.setTokens(data.accessToken);
    if (data.sessionCode) await tokenStorage.setSessionCode(data.sessionCode);
    return data.user;
  },

  async logout() {
    await tokenStorage.clear();
  },

  async requestPasswordChangeOtp(email: string) {
    await api.post("/auth/request-password-change-otp", { email });
  },

  async resetPassword(userId: string, otp: string, newPassword: string) {
    await api.post("/auth/reset-password", { userId, otp, newPassword });
  },
};
