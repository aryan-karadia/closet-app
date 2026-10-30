# PR: feat/ISSUE-25-storage-provider

- Issue closed: ISSUE-25 (StorageProvider abstraction, private bucket, signed URLs)
- Branch: feat/ISSUE-25-storage-provider
- Based on: feat/ISSUE-24-supabase-migrations. Merge order position: 3 of 16, after ISSUE-24 and before ISSUE-26. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, then this branch, then ISSUE-26, ISSUE-21, then resource APIs.

## What changed

- Added `lib/storage/index.js`: StorageProvider interface with `upload(path, file)` and `getSignedUrl(path)`, plus two implementations:
  - `MemoryStorageProvider` for local development and tests. Signed URLs point at the local route `GET /api/storage/<path>?token=...` and expire. It also exposes local only helpers `verifyToken`, `getFile`, and `hasFile`, used by the dev server and by data export.
  - `SupabaseStorageProvider` using the Supabase Storage REST API with fetch (no extra dependency). It uses the service role key server only, never in client code.
- Added `lib/storage/index.d.ts` so TypeScript consumers get types for the JavaScript provider.
- `getStorageProvider()` selects Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise memory. `CLOSET_FORCE_MEMORY_STORAGE=1` forces memory even when Supabase variables are set, for local tests.
- Bucket is private (`closet-images`, see migration 009). There is no public bucket and no public URL. The database stores a path only; signed URLs are generated on read.
- Contract change: No contract change. This branch implements the upload and signed URL sections of the ISSUE-23 contract.

## How to test

- Require the provider in Node and check upload then getSignedUrl round trips with the memory provider, and that an unknown path gives a NOT_FOUND error.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 79, fail 0, skipped 19. Matches the main baseline. No impl-gated test covers storage directly, so no gated test was expected to turn green here.
- Manual provider check (memory provider, run during development): upload of a small buffer then getSignedUrl returned a signed URL with an expiry, and getSignedUrl for a missing path raised NOT_FOUND. That check was ad hoc, not a committed test, because the API tests that exercise storage land with ISSUE-08.

## Mismatch or blocked items

- Blocked: the Supabase implementation has not been exercised against a live Supabase project, because no live project exists in this task. It is written against the documented Supabase Storage REST API and must be confirmed by Agent D or the user against their own project before production use. Local mode uses the memory provider and is fully testable.
- No secrets added. No em dashes added (checked by grep before commit).
