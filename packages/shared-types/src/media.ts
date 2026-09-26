export interface MediaPerson {
  Name: string;
  Id: string;
  Role: string;
  Type?: string;
  PrimaryImageTag?: string;
}

export interface MediaStudio {
  Name: string;
  Id: string;
}

export interface WatchProvider {
  Id: string;
  Name: string;
  LogoPath: string;
}

export interface MediaItem {
  Id: string;
  mediaType?: "movie" | "tv";
  Guid?: string;
  Name: string;
  OriginalTitle?: string;
  Language?: string;
  RunTimeTicks?: number;
  ProductionYear?: number;
  CommunityRating?: number;
  CommunityRatingSource?: string;
  Overview?: string;
  Taglines?: string[];
  OfficialRating?: string;
  Genres?: string[];
  People?: MediaPerson[];
  Studios?: MediaStudio[];
  ImageTags?: {
    Primary?: string;
    Logo?: string;
    Thumb?: string;
    Backdrop?: string;
    Banner?: string;
    Art?: string;
  };
  BackdropImageTags?: string[];
  UserData?: {
    IsFavorite: boolean;
    Likes?: boolean;
    Played?: boolean;
  };
  BlurDataURL?: string;
  WatchProviders?: WatchProvider[];
  likedBy?: {
    userId: string;
    userName: string;
    sessionCode?: string | null;
    hasCustomProfilePicture?: boolean;
    profileUpdatedAt?: string;
  }[];
}

export interface MediaLibrary {
  Id: string;
  Name: string;
  CollectionType?: string;
}

export interface MediaGenre {
  Id: string;
  Name: string;
}

export interface MediaYear {
  Name: string;
  Value: number;
}

export interface MediaRating {
  Name: string;
  Value: string;
}

export interface MediaRegion {
  Id: string;
  Name: string;
}

export interface MediaItemsResponse {
  items: MediaItem[];
  hasMore: boolean;
}

/** Matches the object literal returned by GET /api/flicks (see route.ts). */
export interface Flick {
  id: string;
  movieId?: string;
  movieMediaType?: "movie" | "tv";
  videoUrl: string | null;
  posterUrl?: string;
  moviePosterUrl?: string;
  movieBackdropUrl?: string;
  movieTitle: string;
  movieYear: number;
  uploader: string;
  uploaderAvatarUrl?: string;
  caption: string;
  likes: number;
  comments: number;
  /** Pre-formatted relative time string (e.g. "3 hours ago"), not raw ISO. */
  timestamp: string;
  isFollowedByCurrentUser?: boolean;
  tags?: string[];
}

export interface SessionMember {
  externalUserId: string;
  externalUserName: string;
}

export interface SwipeSession {
  code: string;
  provider?: string;
  members: SessionMember[];
}

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
