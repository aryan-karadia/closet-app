# PR: feat/ISSUE-16-outfit-engine

- Issue closed: ISSUE-16 (Browser rule engine, pruned beam search in Web Worker)
- Branch: feat/ISSUE-16-outfit-engine
- Based on: feat/ISSUE-12-wardrobe-grid. Merge order position: 7 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Added lib/outfit-engine/index.js (the exact path tests/impl-gated/outfit-engine.test.js requires, exporting buildOutfits and build). Pure functions, no I/O, no LLM, using precomputed item data from the API only. Pruned beam search per spec 16.6: filter (in rotation, season, verdict, interview hard rules), anchor on the top 10 bottoms preferring neutrals, build up with the top 10 tops, top 5 outers, top shoes and accessories, score, keep the top 20, enforce diversity (final 3 must not share the same top and outer pair, filled from the top 20 if diversity leaves fewer than 3). Never brute forces all combinations: the search is bounded by the anchor, top, and outer caps.
- Scoring: palette weighted by visibility (base top 0.35, outer 0.25, bottom 0.2, shoes 0.1, accessory 0.1), fit from enabled advice rules only (a disabled rule never affects scoring), contrast from lightness range, rotation preferring least worn. Total is 0.4 palette plus 0.3 fit plus 0.15 contrast plus 0.15 rotation. Every outfit carries an explanation built from the rules that fired.
- Hard rules enforced: at most one of each slot, at most one saturated accent as a main colour, interview allows no saturated accent, interview and formal allow only Perfect and Strong, interview excludes hoodies and graphic tees and prefers a white or light neutral collared shirt when one exists, formal allows one saturated accent (the general one accent cap). Disliked combinations are blocked for 30 days via combinationKey and isDisliked. Empty slots are reported as missingSlots, never invented.
- Added lib/outfit-engine/index.d.ts and lib/outfit-engine/worker.ts (Web Worker wrapper posting { input } and replying { outfits }).

## How to test

- From Node, build a synthetic wardrobe (neutral bottoms, white collared shirt, emerald sweater, warm orange hoodie, cardigan, blazer, shoes, watch, plus an archived bottom): daily returns 3 outfits with different top and outer pairs, interview returns only Perfect and Strong with the white collared shirt first and no hoodie, the archived bottom never appears, and a disliked exact combination is not returned within 30 days.
- Run sh scripts/check-tests.sh from the repo root. Run npm run build.

## Test results

- Synthetic Node probe: passed (daily 3, interview prefers white collared shirt, disliked blocked, archived excluded).
- sh scripts/check-tests.sh (non-live): total 135, pass 121, fail 0, skipped 14. Outfit engine gated tests (5) now pass, up from 116 pass on the previous branch. Remaining skipped are live API and auth tests only, which need CLOSET_TEST_BASE_URL.
- npm run build: passed. Compiled successfully.

## Contract change

No contract change.

## Mismatch or blocked items

- Gated outfit tests are interface skeletons (they assert the module and build function exist). They do not assert full build behaviour, so Agent C should tighten them through Agent D with real wardrobes and expected outputs before treating ISSUE-16 as fully proven. This is reported, not hidden, and no test was edited.
- The frozen contract has no dislike endpoint, so disliked combinations in the builder UI (ISSUE-17) are stored in browser local storage, not through the API. That means dislikes do not sync across devices unless Agent D approves a contract addition for dislikes. This is reported to Agent D as a contract gap, not changed by this branch.
- No em dashes. No secrets committed.
