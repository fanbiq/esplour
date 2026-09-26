import { create } from "zustand";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/api/tokenStorage";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  isHydrating: boolean; // true while we check for a stored token on app boot
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<AuthUser>;
  joinAsGuest: (username: string, sessionCode?: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrating: true,
  isAuthenticated: false,

  // Called once on app boot. We don't have a "whoami" endpoint yet, so we
  // just check whether a token exists — the first authenticated API call
  // will 401 -> refresh -> or log the user out if the token's truly dead.
  hydrate: async () => {
    const token = await tokenStorage.getAccessToken();
    set({ isHydrating: false, isAuthenticated: !!token });
  },

  login: async (username, password) => {
    const user = await authApi.login(username, password);
    set({ user, isAuthenticated: true });
    return user;
  },

  joinAsGuest: async (username, sessionCode) => {
    const user = await authApi.joinAsGuest(username, sessionCode);
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
