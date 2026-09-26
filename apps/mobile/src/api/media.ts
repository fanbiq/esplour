import { api } from "./client";
import type { MediaItem, MediaItemsResponse } from "@/types/media";

export const mediaApi = {
  /** Paginated deck of swipeable titles — same endpoint & params as the web app's SwipeVideoFeed. */
  async getItems(page: number, limit = 20, searchTerm?: string, filters?: Record<string, unknown>) {
    const { data } = await api.get<MediaItemsResponse>("/media/items", {
      params: {
        page,
        limit,
        searchTerm,
        filters: filters ? JSON.stringify(filters) : undefined,
      },
    });
    return data;
  },

  async getItem(id: string, options: { sessionCode?: string | null; mediaType?: "movie" | "tv"; includeUserState?: boolean } = {}) {
    const { data } = await api.get<MediaItem>(`/media/item/${id}`, {
      params: {
        sessionCode: options.sessionCode === null ? "" : options.sessionCode,
        mediaType: options.mediaType,
        includeUserState: options.includeUserState ? 1 : undefined,
      },
    });
    return data;
  },

  async getGenres() {
    const { data } = await api.get("/media/genres");
    return data;
  },

  async getYears() {
    const { data } = await api.get("/media/years");
    return data;
  },

  async getWatchProviders() {
    const { data } = await api.get("/media/watch-providers");
    return data;
  },

  async getLibraries() {
    const { data } = await api.get("/media/libraries");
    return data;
  },
};

export const swipeApi = {
  async swipe(itemId: string, direction: "left" | "right", item?: MediaItem, mediaType?: "movie" | "tv", sessionCode?: string | null) {
    const { data } = await api.post<{ success: boolean; isMatch?: boolean }>("/swipe", {
      itemId,
      direction,
      item,
      mediaType,
      sessionCode,
    });
    return data;
  },

  /** Undo a previous swipe. */
  async unswipe(itemId: string) {
    await api.delete("/swipe", { data: { itemId } });
  },
};

export const likesApi = {
  async getLikes(sortBy: "date" | "rating" | "title" = "date", filter: "all" | "session" | "solo" = "all") {
    const { data } = await api.get("/user/likes", { params: { sortBy, filter } });
    return data;
  },

  async removeLike(itemId: string, sessionCode?: string | null) {
    await api.delete("/user/likes", { params: { itemId, sessionCode } });
  },
};

export const searchApi = {
  async searchUsers(query: string) {
    const { data } = await api.get("/search/users", { params: { query } });
    return data;
  },

  async searchFlicks(query: string) {
    const { data } = await api.get("/search/flicks", { params: { query } });
    return data;
  },
};
