// Canonical definitions now live in @fanbiq/shared-types so the mobile app
// (apps/mobile) shares the exact same shapes instead of a hand-duplicated
// copy. This file re-exports them so every existing `@/types/media` import
// across the web app keeps working unchanged.
export * from "@fanbiq/shared-types/src/media";
