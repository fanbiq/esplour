# fanbIQ (monorepo)

```
fanbiq/
  apps/
    web/      ← the original fanbiq-main Next.js app (web UI + backend API)
    mobile/   ← Expo/React Native app for iOS & Android
  packages/
    shared-types/   ← single source of truth for MediaItem, Flick, AuthUser, etc.
```

`apps/web` and `apps/mobile` are two separate, independently-runnable
programs — a Next.js server and a native app bundle — that both talk to the
**same backend** (the API routes inside `apps/web`). They live in one repo
now for convenience (one PR can touch an API route and the mobile screen
that calls it), not because either app runs "inside" the other.

## Setup

```bash
npm install          # installs and links everything, including the workspace package
npm run web          # starts the Next.js app (http://localhost:3000)
npm run mobile       # starts Metro / Expo dev tools for the mobile app
```

Because this uses **npm workspaces**, run `npm install` once at the repo
root — not separately inside `apps/web` or `apps/mobile`. npm will hoist
shared dependencies and symlink `@fanbiq/shared-types` into both apps'
`node_modules` automatically.

Point the mobile app at your backend:

```bash
FANBIQ_API_URL=https://your-fanbiq-instance.com npm run mobile
```

During local development, `apps/web`'s `npm run dev` serves on
`localhost:3000`, which the Expo dev client (on your phone, or an emulator's
`localhost` alias) generally can't reach directly — tunnel it (`ngrok http
3000`, or Expo's own `--tunnel` flag) or point `FANBIQ_API_URL` at a real
deployment instead.

## Why a shared-types package

`apps/web`'s API routes and `apps/mobile`'s screens both need to agree on
what a `MediaItem` or `Flick` looks like. Before, that agreement was
implicit — I hand-copied the shapes into the mobile app by reading the web
app's code. `packages/shared-types` makes it explicit: both apps import the
*same* type definitions, so if you change a field on the backend (say, add
a field to the `flicks` API response), every mobile screen that reads the
old shape will fail to typecheck immediately instead of breaking at runtime
on someone's phone.

`apps/web/src/types/{auth,media}.ts` and `apps/mobile/src/types/{auth,media}.ts`
are now both just thin re-exports of `@fanbiq/shared-types` — nothing that
already imports from `@/types/media` or `@/types/auth` in either app needed
to change.

Web-only concepts (like `SessionData`, the iron-session cookie payload
shape) stay local to `apps/web/src/types` since mobile has no reason to
know about them.

## Everything else

See `apps/web/README.md` for the original app's docs, and
`apps/mobile/README.md` for the mobile app's auth model, feature coverage,
and known gaps (Google OAuth on mobile, realtime session sync, flick
comments, video upload UI — none of these are wired up yet).
