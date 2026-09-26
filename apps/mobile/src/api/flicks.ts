import { api } from "./client";
import type { Flick } from "@/types/media";

interface FlicksResponse {
  flicks: Flick[];
  total: number;
  page: number;
  hasMore: boolean;
}

type FlickEventType =
  | "flick_viewed"
  | "flick_watch_completed"
  | "flick_skipped"
  | "flick_liked"
  | "flick_added_to_likes_list"
  | "uploader_followed"
  | "flick_comment_added";

export const flicksApi = {
  async getFeed(page = 1, limit = 10, tag?: string) {
    const { data } = await api.get<FlicksResponse>("/flicks", { params: { page, limit, tag } });
    return data;
  },

  async getFlick(id: string) {
    const { data } = await api.get<Flick>(`/flicks/${id}`);
    return data;
  },

  async deleteFlick(id: string) {
    await api.delete(`/flicks/${encodeURIComponent(id)}`);
  },

  async getTags() {
    const { data } = await api.get<string[]>("/flicks/tags");
    return data;
  },

  /** Records a lightweight interaction (view/like/etc) used for the personalization feed ranking. */
  async trackEvent(flickId: string, eventType: FlickEventType, metadata?: Record<string, unknown>) {
    await api.post("/flicks/events", {
      flickId,
      eventType,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  },

  /**
   * Uploads a short video tied to a movie/show. `fileUri` is a local file
   * URI from expo-image-picker / expo-camera. Uses multipart form data —
   * field names must match apps/web/src/app/api/flicks/upload/route.ts
   * exactly (note: the caption field is called `description` server-side).
   */
  async upload(params: {
    fileUri: string;
    fileName: string;
    mimeType: string;
    movieTitle: string;
    movieYear: number;
    tmdbId?: number;
    movieMediaType?: "movie" | "tv";
    moviePosterUrl?: string;
    movieBackdropUrl?: string;
    caption?: string;
    tags?: string[];
  }) {
    const form = new FormData();
    form.append("video", {
      uri: params.fileUri,
      name: params.fileName,
      type: params.mimeType,
    } as unknown as Blob);
    form.append("movieTitle", params.movieTitle);
    form.append("movieYear", String(params.movieYear));
    if (params.tmdbId) form.append("tmdbId", String(params.tmdbId));
    if (params.movieMediaType) form.append("movieMediaType", params.movieMediaType);
    if (params.moviePosterUrl) form.append("moviePosterUrl", params.moviePosterUrl);
    if (params.movieBackdropUrl) form.append("movieBackdropUrl", params.movieBackdropUrl);
    if (params.caption) form.append("description", params.caption);
    if (params.tags?.length) form.append("tags", JSON.stringify(params.tags));

    const { data } = await api.post("/flicks/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

// NOTE: The web app's CommentsSheet UI is currently front-end only — there's
// no real /api/flicks/:id/comments endpoint yet (comments aren't persisted
// server-side in the current backend). Wire this up once that lands; for now
// FlickCommentsSheet on mobile should mirror the same placeholder behavior.
