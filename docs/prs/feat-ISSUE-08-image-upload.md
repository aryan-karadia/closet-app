# PR: feat/ISSUE-08-image-upload

- Issue closed: ISSUE-08 (Image upload signed URLs via StorageProvider)
- Branch: feat/ISSUE-08-image-upload
- Based on: feat/ISSUE-07-item-colours. Merge order position: 11 of 16, after ISSUE-07 and before ISSUE-13. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, then this branch, then ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/api/uploads.js`: POST `/api/uploads` and POST `/api/uploads/signed-url`, both through the StorageProvider from ISSUE-25. No route calls Supabase Storage or S3 directly.
- Upload validation (contract, spec sections 9.1 and 16.4): content type must be `image/webp`, kind must be `image` or `thumbnail`, image width at most 1200px, thumbnail width at most 400px, height at most 4000px, decoded size at most 5MB, base64 data non empty. A path that does not start with `items/<userId>/` is 403. When an itemId is supplied, the item must exist and belong to the user (404 or 403). The response returns the storage path, kind, content type, size, and a short lived signed URL with expiry. The client must store the path in the item record, never the signed URL.
- Signed URL endpoint: path must belong to the user (403 otherwise), expiry 60 to 86400 seconds, default 3600, missing file is 404. The bucket is private in both providers; there is no public bucket and no public URL.
- Registered the upload routes in `lib/api/router.js`. The local signed file route (`GET /api/storage/...`) already landed with ISSUE-21 and serves memory provider files with a valid token.
- Contract change: No contract change. This branch implements the upload and signed URL sections of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: upload a small base64 WebP payload with kind image and width 1200, check the response path starts with `items/user-1/` and a signed URL is returned, then fetch the signed URL and check it returns the file bytes, then request a signed URL for the same path and check it returns a fresh URL.
- Check errors: content type image/png is 400, width 2000 for an image is 400, a path under another user's prefix is 403, a signed URL for a missing file is 404.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 83, fail 0, skipped 15. Matches the previous branch. No impl-gated test covers uploads directly, so no gated test was expected to turn green here.
- Manual dev server checks during development: WebP upload, signed URL fetch, PNG 400, oversize width 400, wrong owner path 403, and missing file 404 were verified with curl. Those checks were ad hoc, not committed tests.

## Mismatch or blocked items

- None for this branch. Agent C tests do not import upload handlers, so there is no interface mismatch.
- Note: the server validates declared width and height fields; it does not decode the image to verify actual dimensions, because no image decoding dependency is available in this environment. Actual dimension verification is a browser responsibility in MVP (the browser compresses before upload, per spec section 16.4), and the declared dimension check enforces the contract at the API boundary. This limitation is recorded here, not hidden.
- No secrets added. No em dashes added (checked by grep before commit).
