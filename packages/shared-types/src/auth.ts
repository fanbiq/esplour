export interface UserSession {
  Id: string;
  Name: string;
  DisplayName?: string;
  AccessToken?: string;
  DeviceId: string;
  isAdmin?: boolean;
  wasMadeAdmin?: boolean;
  isGuest?: boolean;
  provider?: string;
  sessionVersion?: number;
  providerConfig?: {
    serverUrl?: string;
    machineId?: string;
    tmdbToken?: string;
  };
}

/** Alias used on the mobile side — same shape, friendlier name at call sites. */
export type AuthUser = UserSession;
