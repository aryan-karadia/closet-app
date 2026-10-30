# PR: fix/ISSUE-34-unrated-interview-warning

- Issue closed: ISSUE-34
- Branch: fix/ISSUE-34-unrated-interview-warning, from main at cfb03d8
- Agent: A (frontend)
- Decision implemented: the user decision recorded 2026-10-30 in docs/issues/ISSUE-34.md, allow unrated items in interview builds, with a warning.

## What changed

- lib/outfit-engine/index.js: added and exported `isUnrated`, `isInterviewExcluded`, and `unratedSummary`. Interview filtering still rejects Avoid and Works items (verdicts outside Perfect and Strong) and still excludes hoodies and graphic tees, including unrated hoodies. Perfect and Strong items are preferred per slot: if any Perfect or Strong item can fill a slot, unrated items for that slot are dropped, so an unrated item is used only as a fallback when no rated item can fill that slot. Unrated items are never silently treated as Strong. Every interview outfit now carries `hasUnratedItems`, `unratedItemIds`, and `allItemsUnrated`, and its explanation gains "Unrated item included, palette fit not verified" when it contains an unrated item, plus "All items are unrated, so this is not a verified interview outfit." when every item is unrated.
- lib/outfit-engine/index.d.ts: typed the new fields and helpers.
- app/page.tsx: the outfit card now shows the warning for interview outfits, per item ("Unrated, palette fit not verified" beside an unrated item) and per outfit ("Unrated item included, palette fit not verified", plus "Not a verified interview outfit: all items are unrated." for an all-unrated outfit). The card warning is derived from the current items, so it stays correct after a shuffle. shuffleSlot also recomputes the warning fields and rebuilds the explanation warning lines from the new items, instead of keeping stale warnings. An all-unrated outfit is therefore never presented as a verified interview outfit.

## What did not change

- No test file was edited. No file under docs/api-contract.md, docs/openapi.yaml, lib/api/, app/api/, supabase/, or scripts/dev-server.js was edited. No contract change is needed.
- The fallback rule is scoped to interview builds only. Daily and formal builds keep their previous verdict handling on this branch.
- This branch is from main, so it does not include the ISSUE-32 shuffle hard rule validator or the ISSUE-33 diversity fill fix. Those live on their own branches. When Agent D merges, the ISSUE-32 validator and this branch's shuffle warning recompute both touch shuffleSlot and must both be kept, and the ISSUE-33 diversity change and this branch's engine changes both touch buildOutfits and must both be kept.

## How to test

- From the repo root, run: sh scripts/check-tests.sh
- Manual Node checks (no test file edited):
  - Rated interview wardrobe: outfits contain only Perfect or Strong items, no warning, white collared shirt first.
  - Rated shirt, trousers, and shoes plus only an unrated outer: the outfit uses the unrated outer, hasUnratedItems is true, and the explanation carries the unrated warning.
  - All-unrated interview wardrobe: an outfit is returned, hasUnratedItems and allItemsUnrated are true, and the explanation carries both the unrated warning and the not verified line.
  - Rated shirt plus an unrated shirt in the same slot: the rated shirt is chosen and no warning appears.
  - Avoid, Works, hoodie, and graphic tee items, including an unrated hoodie, never appear in an interview outfit.
- UI check: build an interview outfit from a wardrobe with an unrated slot, confirm the per-item and per-outfit warnings on the card and the warning line in "Why this works", then shuffle a slot to an unrated item and confirm the warnings update, and shuffle back to a rated item and confirm they clear.

## Test results

- Manual Node checks above: all cases behaved as expected.
- Full suite, non-live, run in this worktree: sh scripts/check-tests.sh gave total 143, pass 129, fail 0, skipped 14 (the 14 skipped are live API and auth tests only, as in the ISSUE-31 gate baseline).
- npm run build in this worktree: exit 0, compiled successfully, 13 static pages generated.
- No em dashes are used in the changed code or in this file.
