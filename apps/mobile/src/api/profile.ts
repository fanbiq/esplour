import { api } from "./client";

export interface Notification {
  id: number;
  type: string;
  actorId: string | null;
  actorName: string | null;
  message: string;
  createdAt: string | null;
  read: boolean;
  sessionCode: string | null;
  relatedId: string | null;
}

export const notificationsApi = {
  async getAll() {
    const { data } = await api.get<{ data: Notification[] }>("/notifications");
    return data.data;
  },

  async markRead(id: number) {
    await api.patch("/notifications", { action: "markRead", id });
  },

  async markAllRead() {
    await api.patch("/notifications", { action: "markAllRead" });
  },
};

export const profileApi = {
  async getMyProfile() {
    const { data } = await api.get("/user/details");
    return data;
  },

  async getUserProfile(username: string) {
    const { data } = await api.get(`/user/${username}`);
    return data;
  },

  async updateProfile(params: { displayName?: string; bio?: string; username?: string }) {
    const { data } = await api.put("/user/profile", params);
    return data;
  },

  async updateSettings(params: Record<string, unknown>) {
    const { data } = await api.put("/user/settings", params);
    return data;
  },

  async uploadProfilePicture(fileUri: string, fileName: string, mimeType: string) {
    const form = new FormData();
    form.append("image", { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);
    const { data } = await api.post("/user/profile-picture", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

export const followApi = {
  async follow(username: string) {
    const { data } = await api.post(`/user/${username}/follow`);
    return data;
  },
  async unfollow(username: string) {
    await api.delete(`/user/${username}/follow`);
  },
};

export const watchlistApi = {
  async toggle(itemId: string, mediaType: "movie" | "tv", add: boolean) {
    await api.post("/user/watchlist", { itemId, mediaType, add });
  },
};
