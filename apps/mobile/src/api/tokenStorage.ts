import * as SecureStore from "expo-secure-store";

/**
 * Wraps expo-secure-store (Keychain on iOS, Keystore-backed EncryptedSharedPreferences
 * on Android) for the two JWTs and the active session code, so this is the
 * only file that needs to change if you swap storage strategies later.
 */
const ACCESS_TOKEN_KEY = "fanbiq_access_token";
const REFRESH_TOKEN_KEY = "fanbiq_refresh_token";
const SESSION_CODE_KEY = "fanbiq_session_code";

export const tokenStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async getSessionCode() {
    return SecureStore.getItemAsync(SESSION_CODE_KEY);
  },
  async setTokens(accessToken: string, refreshToken?: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  async setSessionCode(code: string | null) {
    if (code) {
      await SecureStore.setItemAsync(SESSION_CODE_KEY, code);
    } else {
      await SecureStore.deleteItemAsync(SESSION_CODE_KEY);
    }
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(SESSION_CODE_KEY),
    ]);
  },
};
