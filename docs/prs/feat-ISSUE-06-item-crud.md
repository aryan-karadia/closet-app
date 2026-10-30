# PR: feat/ISSUE-06-item-crud

- Issue closed: ISSUE-06 (Item CRUD API)
- Branch: feat/ISSUE-06-item-crud
- Based on: feat/ISSUE-10-rating-engine. Merge order position: 9 of 16, after ISSUE-10 and before ISSUE-07. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, then this branch, then ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/api/items.js`: item CRUD (create, list, get, update, soft delete, restore, permanent delete) per spec section 8. Create accepts category, season, fit tags, status (default in rotation), optional price, nullable location field only (no location flow in MVP), photo and thumbnail storage paths, primary colour, score fields, manual score and note, and up to 3 dominant colours.
- Added `lib/api/item-colours.js`: shared item colour helpers used by item creation and, on the next branch, by the item colour subresource. It validates colour sets (max 3, at most one primary, percentage 0 to 100), normalises them (highest percentage becomes primary when none is marked), saves and loads them, loads the active palette, rates a primary colour against that palette, and applies a rating while respecting a manual override (effective paletteScore is the manual score when present, autoScore is never overwritten by a manual score).
- Item auto rating on create: when colours are given and no explicit score was supplied, the item is rated against the user's active palette using the ISSUE-10 engine, filling autoScore, paletteScore, paletteVerdict, nearest palette colour, and ratingReason. When no active palette exists, scores stay as supplied or null.
- Item list filters: category, paletteVerdict, season, fitTag, status, colourFamily (primary colour family), and search (name or fit tag). Sort: paletteScore (highest first), wearCount (least worn first), recent (default), name. Soft deleted items are excluded from lists and single reads.
- Item single read embeds colours and generates short lived signed photo URLs on read (never stored) when a photo path exists and the provider holds the file; otherwise those fields are null instead of failing the read.
- Cost per wear is derived (price divided by wearCount, rounded to 2 decimals, null when price is unknown or wearCount is 0), never stored.
- Soft delete sets deletedAt and status archived, and keeps past wear logs intact (their snapshots are stored at log time, see ISSUE-14). Restore works within 30 days and returns status to in rotation; older soft deletes are 400. Permanent delete requires a prior soft delete, deletes item colours, removes the item from outfits, and keeps wear log snapshots.
- Registered the item routes in `lib/api/router.js`. The dedicated item colour subresource endpoints land on the ISSUE-07 branch.
- Contract change: No contract change. This branch implements the item section of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create an active palette with navy, then create an item with a navy colour and check it rates Perfect or Strong automatically; create an item with no colours and check scores stay null; list items with filters and sort; update the manual score and check paletteScore follows the manual score while autoScore is unchanged; soft delete, check the item disappears from lists and single reads, restore it, then soft delete again and permanent delete it.
- Check errors: no token is 401, another user's item is 403, a missing item is 404, a bad season or a colour set with two primaries is 400.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 83, fail 0, skipped 15. Matches the previous branch (rating gated tests stay green). No impl-gated test covers items directly, so no further gated test was expected to turn green here.
- Manual dev server checks during development: item create with auto rating, list filters, manual override, soft delete, restore, and permanent delete were verified with curl. Those checks were ad hoc, not committed tests. Committed live API tests covering items land with the final test additions and are reported in the final backend report.

## Mismatch or blocked items

- None for this branch. Agent C tests do not import item handlers, so there is no interface mismatch.
- Known convention for later branches: outfit item records in the memory store are keyed by `outfitId:itemId`. The Supabase repository does not use that key; it uses the (outfit_id, item_id) primary key. This is an internal memory store detail, not a contract field.
- No secrets added. No em dashes added (checked by grep before commit).
