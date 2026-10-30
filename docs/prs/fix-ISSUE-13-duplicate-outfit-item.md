# PR: fix/ISSUE-13-duplicate-outfit-item

## Issue closed

ISSUE-13, duplicate outfit item on POST /api/outfits/:outfitId/items.
This is the live failure found by Agent C in the ISSUE-30 contract
update run. This branch fixes only that endpoint. It does not freeze
the contract and it is not merged to main by Agent B.

## Dependency chain and merge order

This branch is first in the chain. It is based on main.

1. fix/ISSUE-13-duplicate-outfit-item (this branch, ISSUE-13 fix)
2. fix/ISSUE-23-openapi-alignment (based on this branch, ISSUE-23 fix)

Agent D merges in that order: this branch first, then the
ISSUE-23 branch. The ISSUE-23 branch depends on this branch.

## What changed

- lib/api/outfits.js, function addOutfitItem: added a duplicate item
  check before any insert, matching the create endpoint
  (validateOutfitItemEntries). If an item already in the outfit is
  added again, even in a free slot, the endpoint now returns 400
  VALIDATION_ERROR with details { items: "Duplicate item in one
  outfit." } and the existing outfit item is left unchanged.
- The existing duplicate slot check is unchanged and still runs
  first, so a different item in an occupied slot still returns 400.
- The POST /api/outfits create endpoint is unchanged; it already
  returned 400 for a duplicate item.

No test file was edited. No contract file was changed.

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
credentials are used anywhere. Placeholders and local test tokens
only (Bearer test:<user-id> in local mode).

## Test results

Without CLOSET_TEST_BASE_URL: total 135, pass 113, fail 0,
skipped 22 (outfit engine 5, palette ingester 3, live API and
auth 14). This matches the Agent D verified baseline on main.

Live against a local dev server
(CLOSET_TEST_BASE_URL=http://localhost:3101, server started with
CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js):
total 135, pass 127, fail 0, skipped 8 (outfit engine 5, palette
ingester 3). Before this fix the live run was total 135, pass 126,
fail 1, skipped 8, so this fix turns the single live failure green
with no other change.

Duplicate item case, called out explicitly:

- Live test: tests/impl-gated/api-and-auth.test.js, "impl api:
  outfit CRUD, duplicate slot, outfit items, and missing item
  distinction", now passes. It adds an item already in the outfit
  in a free slot (shoes) and expects 400 VALIDATION_ERROR.
- Manual live probe on the same dev server: created two items,
  created an outfit with them in base-top and bottom, then posted
  the base-top item again in the shoes slot. Result: 400 with
  error code VALIDATION_ERROR and details { items: "Duplicate
  item in one outfit." }. A follow up list of the outfit items
  showed the item still in base-top and no entry in shoes, so
  the duplicate attempt did not move the item.

## Contract change

No contract change by Agent B in this branch.
docs/api-contract.md already required 400 for a duplicate item on
this endpoint; the implementation now matches it. Agent D freezes
the contract, not Agent B.

## Mismatch or blocked items

None for this issue. The previously reported duplicate item
mismatch is fixed and verified live as above.

Remaining skipped tests are unchanged and are not this issue:
outfit engine 5 (Agent A, ISSUE-16), palette ingester 3 (Agent A,
ISSUE-03 and ISSUE-04), live API and auth 14 without
CLOSET_TEST_BASE_URL. No live Supabase project exists, so
Supabase backed behaviour is untested (ISSUE-31 covers the live
Supabase gate).

## No secrets, no em dashes

No real credentials, API keys, or passwords are in this branch.
Placeholders and local test tokens only. No em dashes are used in
this branch.
