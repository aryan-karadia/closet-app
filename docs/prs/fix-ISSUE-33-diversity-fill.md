# PR: fix/ISSUE-33-diversity-fill

- Issue closed: ISSUE-33
- Branch: fix/ISSUE-33-diversity-fill, from main at cfb03d8
- Agent: A (frontend)

## What changed

- lib/outfit-engine/index.js: removed the diversity fill fallback in buildOutfits that filled from the top 20 in order without checking the seen top and outer pair set. The final outfits now contain only distinct top and outer pairs. When the result has 1 or 2 outfits, a message is attached to the returned array as `diversityMessage`, for example: "Only 1 distinct top and outer pair available, so fewer than 3 outfits are shown instead of repeating a pair." The array shape is unchanged, so existing callers that read length, map, or index still work.
- lib/outfit-engine/index.d.ts: added a `BuildResult` type (an outfit array with an optional `diversityMessage`) and used it for buildOutfits and build.
- app/page.tsx: build now shows the engine diversityMessage as the status when present. If the Web Worker path strips the attached message, the page falls back to the same explanation whenever fewer than 3 outfits are returned, so the user still sees why fewer outfits are shown.

## What did not change

- No test file was edited. No file under docs/api-contract.md, docs/openapi.yaml, lib/api/, app/api/, supabase/, or scripts/dev-server.js was edited. No contract change is needed.
- The diversity rule itself is unchanged: the first candidate for each distinct top and outer pair is kept, in score order, up to 3.

## How to test

- From the repo root, run: sh scripts/check-tests.sh
- Manual Node check (no test file edited): a small wardrobe with 1 top, 1 outer, 3 bottoms, and 2 shoe pairs previously filled to 3 outfits sharing one pair; it now returns 1 outfit with the diversityMessage above. The ISSUE-31 daily wardrobe still returns 3 outfits with 3 distinct pairs and no message.
- UI check: build from a small wardrobe and confirm fewer than 3 outfits are shown together with the status message, and that no two shown outfits share the same top and outer pair.

## Test results

- Manual Node checks above: small wardrobe 1 outfit with message, daily wardrobe 3 outfits with distinct pairs and no message.
- Full suite, non-live, run in this worktree: sh scripts/check-tests.sh gave total 143, pass 129, fail 0, skipped 14 (the 14 skipped are live API and auth tests only, as in the ISSUE-31 gate baseline).
- npm run build in this worktree: exit 0, compiled successfully, 13 static pages generated.
- No em dashes are used in the changed code or in this file.
