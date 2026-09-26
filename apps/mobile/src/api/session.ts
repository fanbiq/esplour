import { api } from "./client";
import { tokenStorage } from "./tokenStorage";
import type { MediaItem } from "@/types/media";
import type { SessionMember } from "@/types/media";

export const sessionApi = {
  async create(allowGuestLending = false) {
    const { data } = await api.post<{ success: true; code: string }>("/session", { action: "create", allowGuestLending });
    await tokenStorage.setSessionCode(data.code);
    return data.code;
  },

  async join(code: string) {
    const { data } = await api.post<{ success: true; code: string }>("/session", { action: "join", code });
    await tokenStorage.setSessionCode(data.code);
    return data.code;
  },

  async leave() {
    await tokenStorage.setSessionCode(null);
  },

  async updateSettings(params: { filters?: Record<string, unknown>; settings?: Record<string, unknown>; allowGuestLending?: boolean }) {
    await api.patch("/session", params);
  },

  async getMembers() {
    const { data } = await api.get<SessionMember[]>("/session/members");
    return data;
  },

  async getMatches() {
    const { data } = await api.get<MediaItem[]>("/session/matches");
    return data;
  },

  async getStats() {
    const { data } = await api.get("/session/stats");
    return data;
  },

  async resetStats() {
    await api.delete("/session/stats");
  },
};
