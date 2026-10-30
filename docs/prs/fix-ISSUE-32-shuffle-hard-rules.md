# PR: fix/ISSUE-32-shuffle-hard-rules

- Issue closed: ISSUE-32
- Branch: fix/ISSUE-32-shuffle-hard-rules, from main at cfb03d8
- Agent: A (frontend)

## What changed

- lib/outfit-engine/index.js: added and exported `isInterviewExcluded`, `seasonMatches`, `verdictAllowed`, and `validateShuffleReplacement`. The validator checks, for a shuffle replacement, in rotation status, season match, palette verdict allowed for the occasion, interview hoodie and graphic tee exclusions, at most one saturated accent (none for interview), and no disliked combination within 30 days. buildOutfits now uses `verdictAllowed` and `isInterviewExcluded` for its own filter, so build and shuffle share the same checks instead of duplicating them.
- lib/outfit-engine/index.d.ts: typed the new helpers.
- app/page.tsx: shuffleSlot now filters every alternative through `validateShuffleReplacement` with the current occasion, season, outfit items, and local dislikes before picking the highest paletteScore survivor. If no alternative passes, the outfit is unchanged and a status message says no alternative passes the hard rules for this occasion.

## What did not change

- No test file was edited. No file under docs/api-contract.md, docs/openapi.yaml, lib/api/, app/api/, supabase/, or scripts/dev-server.js was edited. No contract change is needed.
- Unrated item handling is unchanged on this branch: an item with no paletteVerdict still passes the verdict check, exactly as buildOutfits on main does. That behaviour is the subject of ISSUE-34, which changes the engine and the shuffle warning display on its own branch.

## How to test

- From the repo root, run: sh scripts/check-tests.sh
- Manual Node checks (no test file edited): validateShuffleReplacement rejects a saturated accent top for interview, a hoodie for interview, a Works item for interview, a summer item for a winter build, and a replacement that recreates a fresh disliked combination, and accepts a valid navy sweater for daily.
- UI check: build an interview outfit, shuffle a slot, and confirm the replacement is never a hoodie, graphic tee, Works or Avoid item, a second saturated accent, or a freshly disliked combination. When every alternative would break a rule, confirm the outfit is unchanged with the status message above.

## Test results

- Manual Node checks above: all cases behaved as expected (accent rejected, hoodie rejected, Works rejected, season mismatch rejected, disliked rejected, valid daily accepted).
- Full suite, non-live, run in this worktree: sh scripts/check-tests.sh gave total 143, pass 129, fail 0, skipped 14 (the 14 skipped are live API and auth tests only, as in the ISSUE-31 gate baseline).
- npm run build in this worktree: exit 0, compiled successfully, 13 static pages generated, home route 8.29 kB / 176 kB first load.
- No em dashes are used in the changed code or in this file.
