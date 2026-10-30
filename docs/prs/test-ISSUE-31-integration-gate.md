# PR description: test/ISSUE-31-integration-gate

- Issue closed: ISSUE-31 gate only, not a feature issue. This branch
  does not close any feature issue and does not claim the MVP is done.
- Branch: test/ISSUE-31-integration-gate, created from main.

## What changed

- Added tests/impl-gated/gate-ISSUE-31.test.js: 8 tightened gate tests
  with real wardrobes, real rating inputs, and real ingester page text.
  No existing test was edited. No production code was changed.
- Added tests/INTEGRATION-GATE.md: the full integration gate report,
  mapping each spec section 3 success criterion and each merged issue
  to pass, fail, or unproven, with evidence and bugs reported to
  Agent D.
- Added this PR file.
- No file under lib/, app/, components/, supabase/, or
  scripts/dev-server.js was edited. docs/api-contract.md and
  docs/openapi.yaml were not edited. No contract change.

## How to test

From the repo root:

```
sh scripts/check-tests.sh
```

Live, with a local dev server in another terminal:

```
CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js
CLOSET_TEST_BASE_URL=http://localhost:3101 sh scripts/check-tests.sh
```

Also verified in this gate: npm run build exited 0, with routes for
/, /wardrobe, /items/*, /palette/*, /advice-rules, /outfits/*,
/settings, /sign-in, and /auth/callback.

## Exact test results

- Non-live, without CLOSET_TEST_BASE_URL: total 143, pass 129,
  fail 0, skipped 14. The 14 skipped tests are live API and auth tests
  only.
- Live, CLOSET_TEST_BASE_URL=http://localhost:3101 against a local
  dev server (CLOSET_TEST_MODE=1, PORT=3101): total 143, pass 143,
  fail 0, skipped 0.
- Baseline on main before this gate: total 135, pass 121, fail 0,
  skipped 14 non-live; total 135, pass 135, fail 0, skipped 0 live.
  The increase of 8 is exactly the 8 new gate tests.
- Duplicate outfit item case: passes live, and was confirmed by a
  manual curl probe returning 400 VALIDATION_ERROR.
- Outfit engine gated tests: pass, plus new real wardrobe tests.
- Palette ingester gated tests: pass, plus new real page text tests.
  Real PDF binary parsing and swatch sampling remain unproven.

## Gate verdict

GATE FAILS. Do not treat this branch as an MVP done claim.

- Spec criterion (a) palette upload and correction: FAIL, because
  rendered swatch sampling and the manual tap picker fallback from
  spec 4.3 step 2 are not implemented, and no real PDF was run.
- Spec criterion (b) rating cases: PASS.
- Spec criterion (c) outfit hard rules: PASS on generation, FAIL on
  the shuffle path (Bug 1) and on small wardrobe diversity (Bug 2).
- Spec criterion (d) outfit scores and reasoning: PASS on the build
  path.
- Spec criterion (e) Android PWA, no paid service: UNPROVEN, no real
  Android device and no live Supabase project in this environment.
- Additional open items: account delete is blocked with no endpoint
  (Settings honestly reports this and deletes nothing), storage usage
  is estimated with no endpoint, dislikes are local storage only and
  do not sync, advice rule avoidTag is not in the API shape.

Bugs reported to Agent D, not fixed in this branch:
1. app/page.tsx shuffleSlot picks the highest scoring alternative
   without re-checking accent count, interview exclusions, or
   disliked combinations.
2. lib/outfit-engine/index.js buildOutfits fills the final 3 from the
   top 20 without checking the seen top and outer pair set, so a small
   wardrobe can return repeated pairs.
3. Minor: the engine interview filter passes items with a null palette
   verdict, because it only rejects when a verdict is set.

## Mismatch or blocked item

- No new contract mismatch was found. The frozen contract was not
  changed.
- Blocked: real Supabase project verification, real Android device
  verification, real PDF binary verification, and real photo pipeline
  verification, for the reasons in tests/INTEGRATION-GATE.md.
- Secrets check: no real credentials added. Em dash check: none found
  in new files. Vue check: no Vue import found. .env.local was not
  created or committed.
