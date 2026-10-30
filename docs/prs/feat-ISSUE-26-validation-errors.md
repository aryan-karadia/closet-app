# PR: feat/ISSUE-26-validation-errors

- Issue closed: ISSUE-26 (Validation and error handling standard)
- Branch: feat/ISSUE-26-validation-errors
- Based on: feat/ISSUE-25-storage-provider. Merge order position: 4 of 16, after ISSUE-25 and before ISSUE-21. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, then this branch, then ISSUE-21, then resource APIs.

## What changed

- Added `lib/api/errors.js`: one error shape `{ error: { code, message, details? } }` with ApiError and helpers for 400 VALIDATION_ERROR, 401 UNAUTHENTICATED, 403 FORBIDDEN, 404 NOT_FOUND, 405 METHOD_NOT_ALLOWED, and 500 INTERNAL_ERROR, plus a mapper from provider errors to the same shape.
- Added `lib/api/validate.js`: shared field validators (required and optional strings, numbers, integers, booleans, enums, hex colours, string arrays, dates, range pairs), a details collector that reports all field problems in one 400, pagination parsing (page starts at 1, pageSize clamped to 1 to 100, non numeric values are 400), list pagination, and boolean query parsing.
- Added `lib/api/http.js`: handler result helpers (`ok`, `created`, `handleError`) and the derived `costPerWear` helper (price divided by wearCount, rounded to 2 decimals, null when price is unknown or wearCount is 0).
- Contract change: No contract change. This branch implements the error and validation sections of the ISSUE-23 contract. Later resource branches use these helpers for every endpoint, so validation behaviour is consistent rather than per route.

## How to test

- Run: `sh scripts/check-tests.sh` from the repo root.
- The helpers are exercised for real by the API tests that land with the resource branches (ISSUE-01 onwards), which check 400, 401, 403, and 404 cases through the live dev server.

## Test results

- Agent C suite on this branch: total 98, pass 79, fail 0, skipped 19. Matches the main baseline. No impl-gated test covers validation helpers directly, so no gated test was expected to turn green here.

## Mismatch or blocked items

- None. Validation helpers are internal; Agent C tests do not import them, so there is no interface mismatch to report.
- No secrets added. No em dashes added (checked by grep before commit).
