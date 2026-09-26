# fanbIQ Mobile (Expo / React Native)

> Part of the fanbIQ monorepo — see the [root README](../../README.md) for
> how this app relates to `apps/web` and `packages/shared-types`. Run
> `npm install` from the **repo root**, not this folder.

A React Native boilerplate for the fanbIQ web app (`apps/web`), built with
**Expo Router**, **TanStack Query**, and **Zustand**, talking to the *same*
Next.js backend the web app uses.

This is a boilerplate, not a pixel-perfect clone — it wires up real,
working auth and data flows for every major feature so you have a solid
foundation to build the UI out further.

## What's implemented

- **Auth**: email/password login, registration + OTP email verification, guest join, logout, token refresh
- **Swipe deck**: paginated media feed with a gesture-driven swipe card (like/pass), backed by the real `/api/swipe` + `/api/media/items` endpoints
- **Likes**: grid view with All/Solo/Session filters, remove-like
- **Flicks**: TikTok-style vertical video feed with view/like event tracking
- **Sessions**: create/join a shared swipe session by code, view members, view matches
- **Search**: user search
- **Profile**: view own profile, notifications badge, logout
- Movie detail, public user profile, and single-flick detail screens

## Setup

From the **repo root**:

```bash
npm install
FANBIQ_API_URL=https://your-fanbiq-instance.com npm run mobile
```

Or `cd apps/mobile && npx expo start` after the root install has run once.
The important bit is that `FANBIQ_API_URL` points at your deployed (or
tunneled, e.g. via ngrok for local dev) fanbIQ instance, since the app talks
to it over HTTPS.

Replace the placeholder images in `assets/` (`icon.png`, `adaptive-icon.png`,
`splash.png`) with real artwork before shipping.

## How auth works (read this before you touch anything auth-related)

The web app uses **httpOnly cookies** (`iron-session`). Mobile doesn't have
a cookie jar wired up by default, so this boilerplate adds a **parallel
token-based auth path** on the backend (see the `apps/web` changes described here)
that the web app doesn't use at all — nothing about web login changed.

- `src/api/client.ts` — attaches `Authorization: Bearer <token>` and
  `X-Session-Code: <code>` (for group sessions) to every request, and
  auto-refreshes the access token once on a 401 before giving up.
- `src/api/tokenStorage.ts` — stores tokens in the OS Keychain/Keystore via
  `expo-secure-store`. Swap this out if you want a different strategy.
- `src/store/authStore.ts` — the Zustand store the UI reads from
  (`isAuthenticated`, `user`, `login`, `joinAsGuest`, `logout`).

Access tokens last 15 minutes; refresh tokens last 30 days. Both embed the
account's `sessionVersion`, so bumping that value server-side (already how
the web app invalidates sessions on password change) instantly kills every
outstanding mobile token too — no separate revocation list needed.

## Backend changes required (already applied to `apps/web`)

If you're pointing this app at a *different* copy of the fanbIQ backend, port
these over:

1. `src/lib/server/mobile-jwt.ts` (new) — signs/verifies the JWTs.
2. `src/lib/server/validate-session.ts` (modified) — checks for a Bearer
   token first, falls back to the cookie session. This is the only shared
   file that changed, and it's why every other existing API route (media,
   likes, search, notifications, profile, follow, watchlist, session
   management, etc.) needed **zero** changes to support mobile.
3. Four new routes under `src/app/api/mobile/auth/`: `login`, `verify`,
   `refresh`, `guest`. (Registration, resend-verification, and password
   reset didn't need mobile versions — they never touched cookies, so the
   app calls the existing `/api/auth/*` endpoints directly.)
4. `jose` added to `package.json` — just `npm install` at the repo root — it's in the workspace already.

Optionally set `MOBILE_JWT_SECRET` in the backend's env if you want a secret
dedicated to mobile tokens instead of reusing the app's existing auth secret
(the current code reuses `getAuthSecret()`, which is fine, just coupling the
two).

## Known gaps / things to build out next

- **Google OAuth on mobile** isn't wired up. The web app's Google login is a
  browser redirect flow; on mobile you'd want `expo-auth-session` (or
  `expo-web-browser`) to open the OAuth flow and exchange the resulting
  identity for a token pair via a new endpoint.
- **Realtime session sync** is SSE-based on web. This boilerplate uses
  polling (React Query refetch) instead of a persistent connection — fine
  to start, but for a snappier "someone else just liked this" feel you'll
  want either a polling interval bump during active sessions or a proper
  WebSocket/SSE client (`react-native-sse`) for `/api/events`.
- **Flick comments** aren't wired up because the *web app itself* doesn't
  have a persisted comments API yet (`CommentsSheet.tsx` is front-end only
  today) — nothing to connect to on mobile until that exists server-side.
- **Video upload UI** — `flicksApi.upload()` is ready to go but there's no
  camera/picker screen yet; wire up `expo-image-picker` and call it.
- **Provider config / admin screens** (Jellyfin/Emby/Plex/TMDB server setup)
  aren't ported — these are typically one-time setup done from the web
  admin UI rather than something end users touch on mobile, but the API
  wrappers can be extended into `src/api/media.ts` if you want them.
- Filters/sort UI on the swipe deck is a stub (the icon is there, no sheet
  behind it yet) — `mediaApi.getItems()` already accepts a `filters` object
  matching the web app's shape.

## Project structure

```
app/                  # expo-router file-based routes
  (auth)/             # login, register, verify, guest — shown when logged out
  (tabs)/             # swipe, likes, flicks, search, session, profile
  movie/[id].tsx       user/[username].tsx       flick/[id].tsx
src/
  api/                # axios client + one module per feature area
  components/         # deck/VideoCard, deck/DeckControls, MediaImage
  hooks/
  store/              # authStore (zustand)
  types/              # thin re-exports of @fanbiq/shared-types
```
