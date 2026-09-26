import { AxiosError } from "axios";
import { API_BASE_URL } from "./client";

/**
 * A generic "check your credentials" message for every failure — network
 * error, timeout, wrong password, server 500 — makes the real problem
 * invisible. This picks apart what actually happened so a dead
 * FANBIQ_API_URL (e.g. "localhost" on a physical device, which resolves to
 * the phone itself) doesn't masquerade as a login mistake.
 */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const error = err as AxiosError<{ message?: string; error?: string }>;

  if (error?.isAxiosError) {
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return "The server is taking longer than expected to start. Please try again in a moment.";
      }
      // Request never reached the server: DNS failure, connection refused,
      // timeout, wrong host, etc.
      return `Can't reach the server at ${API_BASE_URL}. Check FANBIQ_API_URL in apps/mobile/.env — "localhost" won't work from a physical device, use your computer's LAN IP or a tunnel instead.`;
    }
    return error.response.data?.message ?? error.response.data?.error ?? fallback;
  }

  return fallback;
}
