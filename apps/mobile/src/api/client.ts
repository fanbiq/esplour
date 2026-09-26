import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { tokenStorage } from "./tokenStorage";

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? "https://your-fanbiq-instance.example.com";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15_000,
});

// Attach the bearer token + active session code (for group-swipe sessions)
// to every outgoing request.
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const [accessToken, sessionCode] = await Promise.all([tokenStorage.getAccessToken(), tokenStorage.getSessionCode()]);

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (sessionCode) {
    config.headers.set("X-Session-Code", sessionCode);
  }

  if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
    config.headers.set("Content-Type", "application/json");
  }

  console.log("[mobile api request]", {
    url: `${config.baseURL ?? ""}${config.url ?? ""}`,
    method: config.method?.toUpperCase(),
    headers: Object.fromEntries(Object.entries(config.headers ?? {}).map(([key, value]) => [key, value])),
  });

  return config;
});

// On a 401, try exactly once to refresh the access token and replay the
// original request. If the refresh token is also dead, surface the 401 so
// the app-level auth store can log the user out.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/mobile/auth/refresh`, { refreshToken });
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    console.log("[mobile api error]", {
      url: `${original?.baseURL ?? ""}${original?.url ?? ""}`,
      method: original?.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        original.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return api(original);
      }
    }

    return Promise.reject(error);
  }
);
