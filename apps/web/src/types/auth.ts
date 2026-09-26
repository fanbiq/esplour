import { Filters } from "./session";

// UserSession's canonical shape now lives in @fanbiq/shared-types.
export type { UserSession } from "@fanbiq/shared-types/src/auth";
import type { UserSession } from "@fanbiq/shared-types/src/auth";

export interface SessionData {
  user: UserSession;
  sessionCode?: string;
  isLoggedIn: boolean;
  soloFilters?: Filters;
  tempDeviceId?: string;
  tempPinId?: number;
  providerConfig?: {
    serverUrl?: string;
    machineId?: string;
    tmdbToken?: string;
  };
}
