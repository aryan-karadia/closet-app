# PR: feat/ISSUE-07-item-colours

- Issue closed: ISSUE-07 (Item colour storage API)
- Branch: feat/ISSUE-07-item-colours
- Based on: feat/ISSUE-06-item-crud. Merge order position: 10 of 16, after ISSUE-06 and before ISSUE-08. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, then this branch, then ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/api/item-colour-routes.js`: the item colour subresource. GET `/api/items/:itemId/colours` lists the item colours in the list envelope. POST `/api/items/:itemId/colours` replaces the full set (body `{ colours: [...] }`, max 3, at most one primary, percentage 0 to 100, Lab derived from hex when omitted, highest percentage becomes primary when none is marked).
- After replacement, the item is re-rated against the active palette when it has no manual score, updating autoScore, paletteScore, verdict, nearest palette colour, and reason. When the item has a manual score, the manual score stays as the effective score. When the replacement set is empty, the item primary colour and scores are cleared to null.
- The colour storage itself (validation, normalisation, save, load, rating helpers) already landed in `lib/api/item-colours.js` on the ISSUE-06 branch, because item creation needed it. This branch adds only the subresource routes on top of that shared helper, so there is no duplicate colour logic.
- Registered the item colour routes in `lib/api/router.js`.
- Contract change: No contract change. This branch implements the item colour section of the ISSUE-23 contract. Items also return colours embedded on single reads, as documented in the contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create an item, replace its colours with a navy primary and check the list returns them and the item score updates, replace with an empty set and check scores clear, then check a set with two primaries is 400 and another user's item is 403.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 83, fail 0, skipped 15. Matches the previous branch. No impl-gated test covers item colours directly, so no gated test was expected to turn green here.
- Manual dev server checks during development: colour list, replacement with re-rate, empty set clearing, two primary 400, and wrong owner 403 were verified with curl. Those checks were ad hoc, not committed tests.

## Mismatch or blocked items

- None for this branch. Agent C tests do not import item colour routes, so there is no interface mismatch.
- No secrets added. No em dashes added (checked by grep before commit).
