# PR: feat/ISSUE-14-wear-logs

- Issue closed: ISSUE-14 (Wear log CRUD and wear count)
- Branch: feat/ISSUE-14-wear-logs
- Based on: feat/ISSUE-13-outfit-crud. Merge order position: 13 of 16, after ISSUE-13 and before ISSUE-15. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, then this branch, then ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/api/wear-logs.js`: wear log create, list (with outfitId and occasion filters, sorted by wornAt descending), get, and delete. Create requires an outfit owned by the user and at least one item owned by the user, stores item snapshots (itemId and itemName at log time), and defaults wornAt to today when omitted.
- Logging an outfit as worn increments wear count for every listed item and sets lastWornAt to wornAt, so cost per wear (derived on item reads) updates automatically. Deleted items are skipped for the count increment, because a deleted item is no longer in rotation, but the log itself is still created with its snapshot.
- Deleting a wear log decrements wear counts for its items, floored at 0. LastWornAt is left unchanged on delete, as recorded in the contract, because recomputing it from remaining logs is a later improvement and is not silently guessed.
- Past wear logs keep deleted items as snapshots: item deletion (soft or permanent) does not change existing wear logs, so history is not rewritten (spec sections 6.7 and 7).
- Registered the wear log routes in `lib/api/router.js`.
- Contract change: No contract change. This branch implements the wear log section of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create two items and an outfit, log the outfit as worn, check both items have wearCount 1 and lastWornAt set, log again and check wearCount 2, delete the wear log and check wearCount returns to 1, then delete an item and check the remaining wear log still shows its snapshot name.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 83, fail 0, skipped 15. Matches the previous branch. No impl-gated test covers wear logs directly, so no gated test was expected to turn green here.
- Manual dev server checks during development: wear log create with wear count increment, second log, delete with decrement, and snapshot retention were verified with curl. Those checks were ad hoc, not committed tests.

## Mismatch or blocked items

- None for this branch. Agent C tests do not import wear log handlers, so there is no interface mismatch.
- No secrets added. No em dashes added (checked by grep before commit).
