# PR: test/ISSUE-30-contract-update

## Issue closed

ISSUE-30 contract update only, not a feature issue. This branch updates
the API contract tests from skeletons to Agent B's real draft contract.
It does not close any feature issue, and it does not claim any feature
is done. The contract is DRAFT, not frozen. Agent D freezes the contract
after this update.

## What changed

Only these files, on branch test/ISSUE-30-contract-update, created from
main:

- tests/unit/api-contract.test.js: rewritten from 8 skeleton tests to
  16 tests against the draft contract. The file now embeds the full
  52 endpoint table from docs/api-contract.md, with real paths for
  auth session, profile, palettes (including activate, versions, and
  rerate), palette colours, avoid rules, items (including restore and
  permanent-delete), item colours, uploads and signed URLs, the local
  storage route, outfits, outfit items, wear logs, advice rules
  (including seed), and export. It checks request schemas, response
  schemas, enums, the single JSON error shape
  { error: { code, message, details? } } with 400 VALIDATION_ERROR,
  401 UNAUTHENTICATED, 403 FORBIDDEN, 404 NOT_FOUND, 405
  METHOD_NOT_ALLOWED, and 500 INTERNAL_ERROR, auth rules
  (unauthenticated 401, wrong owner 403, protected API routes return
  401 not a redirect), validation rules, and pagination.
- tests/integration/api-contract.test.js: rewritten from 4 skeleton
  tests to 11 self contained draft contract flow tests (CRUD matrix,
  error mapping, auth flow, palette lifecycle, item lifecycle, outfit
  and wear log flows, upload flow, advice seed flow, export ZIP versus
  JSON errors, pagination envelope and list versus single shapes).
  These do not call a live server.
- tests/impl-gated/api-and-auth.test.js: rewritten from 6 tests
  (5 skipped skeleton paths plus a marker) to 15 tests (14 real live
  tests plus a marker) using real draft contract paths. Live tests run
  only when CLOSET_TEST_BASE_URL is set, for example
  http://localhost:3101 against a local dev server started with
  CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js, using
  local test tokens Bearer test:<user-id>. Without that variable the
  14 live tests are skipped, not faked green.
- tests/TEST-PLAN.md: contract sections updated to UPDATED TO DRAFT
  CONTRACT, latest runs recorded, remaining skeleton items, mismatches,
  and blocked items listed explicitly.

No production code was changed (nothing under lib/, app/, supabase/,
or scripts/dev-server.js). No other test file was changed. The contract
files docs/api-contract.md and docs/openapi.yaml were not changed.

## How to test

From the repo root, no dependencies to install:

```
sh scripts/check-tests.sh
```

For the live check, in one terminal start the local dev server, then
in another run the same check with the base URL set:

```
CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js
CLOSET_TEST_BASE_URL=http://localhost:3101 sh scripts/check-tests.sh
```

No live Supabase project was tested. No live project exists. No real
credentials are used anywhere. Placeholders and local test tokens only.

## Test results

Baseline on main before this change (Agent D verified): total 111,
pass 98, fail 0, skipped 13 (outfit engine 5, palette ingester 3,
live API and auth 5 without CLOSET_TEST_BASE_URL).

After this change, without CLOSET_TEST_BASE_URL: total 135, pass 113,
fail 0, skipped 22 (outfit engine 5, palette ingester 3, live API and
auth 14).

After this change, with CLOSET_TEST_BASE_URL=http://localhost:3101
against a local dev server: total 135, pass 126, fail 1, skipped 8
(outfit engine 5, palette ingester 3). The single failure is the
documented contract versus implementation mismatch below, not a test
error. The test follows the contract and was not changed to hide the
mismatch.

## Contract change

No contract change by Agent C. Agent C changed neither
docs/api-contract.md nor docs/openapi.yaml.

Disagreements found between the contract doc and OpenAPI, where the
contract doc wins per Agent B report, and Agent C tests follow the
contract doc (correction routed through Agent D to Agent B):

1. GET /api/storage/:path is in the contract table but has no path
   entry in docs/openapi.yaml.
2. 405 METHOD_NOT_ALLOWED is in the contract error table but no 405
   response appears in docs/openapi.yaml.
3. List query params in the contract are missing from
   docs/openapi.yaml: palettes isActive and sort, palette colours
   sort, avoid rules sort, item colours and outfit items pagination.
4. Contract list responses exclude embedded children (palettes list
   without colours and avoidRules, items list without colours,
   outfits list without items), but docs/openapi.yaml reuses the
   full Palette, Item, and Outfit schemas for list responses. The
   local implementation follows the contract doc on this point,
   verified by live probe.
5. Upload width and height maxima in the contract (image 1200,
   thumbnail 400, height 4000) and the 5MB decoded size limit are
   missing from docs/openapi.yaml UploadCreate, which only sets
   minimum 1.
6. Contract page and pageSize out of range values are clamped, but
   docs/openapi.yaml PageSize bounds (1 to 100) read as rejection
   rather than clamping. Non numeric values are 400 in the contract.
7. Outfit item delete response in the contract is
   { deleted, outfitId, itemId }, but docs/openapi.yaml Deleted
   schema only has deleted, id, and softDeleted.
8. Export Content-Disposition filename pattern
   closet-export-<date>.zip is in the contract but not specified
   in docs/openapi.yaml.
9. PaletteColour labL range 0 to 100 in the contract has no min or
   max in docs/openapi.yaml PaletteColourCreate.

## Mismatch and blocked items

Mismatch, contract versus implementation, reported to Agent D, not
hidden: POST /api/outfits/:outfitId/items, duplicate item.

- Expected per contract: adding an item already in the outfit returns
  400 VALIDATION_ERROR, on this endpoint as well as on POST
  /api/outfits.
- Actual on the local dev server: adding the same item in a free slot
  returns 201 and moves the item to the new slot, keyed by itemId, so
  the outfit ends with one entry in the new slot and the old slot
  entry is gone. Adding a different item to an occupied slot correctly
  returns 400 duplicate slot, and POST /api/outfits create correctly
  returns 400 for a duplicate item, so only the outfit items endpoint
  duplicate item check is missing.
- Recommendation: Agent B adds a duplicate item check to POST
  /api/outfits/:outfitId/items returning 400 VALIDATION_ERROR before
  any upsert, matching the create endpoint, then Agent C re-runs the
  live check. Agent D decides whether to merge this test branch
  before or after that fix, since the unserved check passes but the
  live check does not.

Blocked items, also recorded in tests/TEST-PLAN.md under Blocked:

- The contract is DRAFT, not frozen. Agent D freezes it after this
  update. A later freeze change would need another Agent C update.
- The 9 contract versus OpenAPI disagreements above, correction
  through Agent D to Agent B.
- The duplicate item mismatch above, routing through Agent D to
  Agent B.
- Remaining skipped tests, unchanged: outfit engine 5 (Agent A,
  ISSUE-16), palette ingester 3 (Agent A, ISSUE-03 and ISSUE-04),
  live API and auth 14 without CLOSET_TEST_BASE_URL.
- No live Supabase project exists, so Supabase backed behaviour is
  untested. ISSUE-31 covers the live Supabase gate.
- No skeleton items remain in the three contract test files.

## No secrets, no em dashes

No real credentials, API keys, or passwords are in this branch.
Placeholders and local test tokens only. No em dashes are used in
this branch.
