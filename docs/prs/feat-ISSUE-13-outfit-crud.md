# PR: feat/ISSUE-13-outfit-crud

- Issue closed: ISSUE-13 (Outfit and outfit item CRUD API)
- Branch: feat/ISSUE-13-outfit-crud
- Based on: feat/ISSUE-08-image-upload. Merge order position: 12 of 16, after ISSUE-08 and before ISSUE-14. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, then this branch, then ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/api/outfits.js`: outfit CRUD (create, list with occasion and saved filters and totalScore or recent sort, get with items embedded, update, delete) and outfit item subresource (list, add, remove). Outfit fields: occasion, season, vibe, palette, fit, contrast, rotation, and total scores, explanation array, saved flag.
- Validation: duplicate slots in one outfit are 400, duplicate items in one outfit are 400, invalid slots are 400, missing items are 400, items owned by another user are 403, soft deleted items are 400. Item changes go through the outfit item endpoints; PATCH on an outfit does not change its items, as documented in the contract.
- Deleting an outfit deletes its outfit items. Wear logs are kept, with their snapshots, as documented in the contract.
- Fixed the Supabase repository for outfit items: the memory store keys outfit items by `outfitId:itemId`, which is not a Supabase column. The Supabase repository now translates that key to the composite (outfit_id, item_id) primary key on get and delete, and strips the memory key on insert. This fix is recorded here; it does not change the contract.
- Registered the outfit and outfit item routes in `lib/api/router.js`.
- Contract change: No contract change. This branch implements the outfit and outfit item sections of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create two items, create an outfit with one item in base-top and one in bottom, check the outfit returns both with names, try adding a second base-top item and check it is 400, add a shoes item through the outfit item endpoint, remove it, then delete the outfit.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 83, fail 0, skipped 15. Matches the previous branch. No impl-gated test covers outfit CRUD directly (the outfit engine gated tests belong to Agent A, ISSUE-16), so no gated test was expected to turn green here.
- Manual dev server checks during development: outfit create with items, duplicate slot 400, outfit item add and remove, and outfit delete were verified with curl. Those checks were ad hoc, not committed tests.

## Mismatch or blocked items

- None for this branch. Agent C tests do not import outfit handlers, so there is no interface mismatch. The outfit engine (ISSUE-16, Agent A) is out of scope for this backend branch; this branch provides only the CRUD storage the engine will read from.
- No secrets added. No em dashes added (checked by grep before commit).
