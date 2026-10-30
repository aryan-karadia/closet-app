# PR: feat/ISSUE-20-google-auth

- Issue closed: ISSUE-20 (Google Auth via Supabase Auth, session, protected routes)
- Branch: feat/ISSUE-20-google-auth
- Based on: main. Merge order position: 1 of 12 in the Agent A frontend chain. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27. Each later branch is based on the previous frontend branch.
- Dependency chain: main, then this branch, then feat/ISSUE-03-palette-ingester, feat/ISSUE-04-palette-correction, feat/ISSUE-09-background-removal, feat/ISSUE-11-item-ui, feat/ISSUE-12-wardrobe-grid, feat/ISSUE-16-outfit-engine, feat/ISSUE-17-outfit-builder, feat/ISSUE-18-advice-rules-ui, feat/ISSUE-19-saved-outfits, feat/ISSUE-22-settings, feat/ISSUE-27-pwa-offline.

## What changed

- Fixed stack used: Tailwind CSS, shadcn/ui style components, React, Next.js with TypeScript. No Vue, no other UI framework. Tailwind, Supabase JS, and pdfjs-dist added to package.json; package-lock.json added.
- Added lib/supabase-client.ts (auth session only, placeholder env values treated as not configured), lib/auth.tsx (AuthProvider, Google sign in via Supabase Auth, session handling, sign out, protected route redirect to /sign-in), lib/api-client.ts (frozen API client only, Bearer token from local storage), lib/types.ts (contract field names, no invented fields).
- Added app/layout.tsx with Nav, app/sign-in/page.tsx (Google sign in only; a clearly labelled local test sign in is offered only when no Supabase project is configured, for the local dev server test mode), app/auth/callback/page.tsx (Supabase code exchange), app/page.tsx placeholder home (replaced by the builder on the ISSUE-17 branch), components/ui.tsx, components/Nav.tsx, components/ScoreBadge.tsx, app/globals.css, postcss.config.mjs.
- No backend file, test file, or contract file was changed. No data is read from Supabase Postgres or Storage directly; all wardrobe data goes through the frozen API.

## How to test

- Run npm install, then npm run dev, and open / . Without a session you are redirected to /sign-in.
- With a Supabase project configured in .env.local, use Sign in with Google, then confirm the callback lands on /.
- Without a Supabase project, start the local dev server (CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js), set NEXT_PUBLIC_CLOSET_API_BASE to http://localhost:3101 if the Next app runs separately, and use the labelled local test sign in with user id user-1. Then GET /api/auth/session returns that user.
- Run sh scripts/check-tests.sh from the repo root.

## Test results

- npm install: passed (Next.js 15.5.28, React 19, Tailwind, Supabase JS, pdfjs-dist installed).
- npm run build: passed. Compiled successfully. Routes: /, /auth/callback, /sign-in, /api/[...path].
- sh scripts/check-tests.sh (non-live): total 135, pass 113, fail 0, skipped 22. Matches the frozen baseline. Outfit engine 5 and palette ingester 3 remain skipped here; they are addressed on later branches.
- Live test run against a local dev server was not run on this branch alone, because no new live endpoint behaviour is introduced; the auth session endpoint is already covered by the backend live suite, and the final branch report includes a live run.

## Contract change

No contract change.

## Mismatch or blocked items

- No live Supabase project exists, so Google sign in against a real Supabase project is untested in this environment (same limitation as the contract freeze). The code path is the standard Supabase Auth OAuth flow with a code exchange callback. This is a blocked item for live verification, not a code change.
- No em dashes. No secrets committed. .env.local is gitignored and was not created.
