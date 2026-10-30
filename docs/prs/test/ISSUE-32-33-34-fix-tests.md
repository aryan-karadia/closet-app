# PR: test/ISSUE-32-33-34-fix-tests (Agent C, fix run)

Issues closed by the tests in this branch, once the Agent A fix lands:
ISSUE-32 (shuffle slot must re-check all hard rules), ISSUE-33
(diversity fill must not repeat top and outer pairs), ISSUE-34
(interview unrated items allowed only as a fallback, with a warning).
This branch closes no issue by itself. It only supplies the tests.
Agent D merges. Do not merge this branch as a green suite while the
7 pre-fix failures listed below stand.

## What changed

Test files only. No production code, backend code, or contract file
was changed. No file under lib/, app/, components/, supabase/, or
scripts/dev-server.js was edited, and neither docs/api-contract.md
nor docs/openapi.yaml was edited.

- tests/unit/shuffle-diversity-interview-fix.test.js, 15 new tests,
  GREEN spec oracle, refs ISSUE-32, ISSUE-33, ISSUE-34, spec 6.1,
  6.2, 6.3, 6.4. Shuffle cases: extra saturated accent, interview
  excluded category, Avoid verdict, disliked combination, only that
  slot changes, no valid alternative keeps the original with a
  message, and unrated interview alternative as a fallback only with
  a warning. Diversity cases: distinct pairs, fewer outfits only
  with a message, repeats never valid. Interview unrated cases:
  rated first, all-unrated never verified, Avoid and excluded
  categories still rejected, missing verdict equals null verdict,
  unrated allowed as a fallback.
- tests/impl-gated/fix-ISSUE-32-33-34.test.js, 14 new tests, refs
  ISSUE-32, ISSUE-33, ISSUE-34, spec 6.1, 6.3, 6.4. These import the
  existing public engine interface buildOutfits. They were written
  from the spec and the ISSUE-34 decision, not from any Agent A fix
  code, and they invent no new engine helper name.
- tests/TEST-PLAN.md: latest run section for this branch, mapping
  for both new files, and a new Blocked item 10 for the open UI
  checks and the unspecified message channel.

## How to test

From the repo root, no dependencies to install:

```
sh scripts/check-tests.sh
```

Live, against a local dev server only, no real credentials:

```
CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js
CLOSET_TEST_BASE_URL=http://localhost:3101 sh scripts/check-tests.sh
```

## Test results

Non-live, without CLOSET_TEST_BASE_URL:
- Total 172, Pass 145, Fail 7, Skipped 20.
- Baseline before this branch (ISSUE-31 gate, non-live): Total 143,
  Pass 129, Fail 0, Skipped 14. This branch adds 29 tests.

Live, against the local dev server above:
- Total 172, Pass 159, Fail 7, Skipped 6.
- No new live failure. The 14 live API and auth tests that were
  skipped without a server now pass.

The 7 failures, all pre-fix reproductions on main at cfb03d8:
- ISSUE-33 diversity, 3 tests: one-pair wardrobe returns 3 outfits
  sharing a pair, two-pair wardrobe returns 3 outfits with a repeat,
  fewer outfits carry no message.
- ISSUE-34 interview unrated, 4 tests: score 99 unrated top sorted
  before a rated top, same for a missing paletteVerdict, unrated
  fallback top with no warning in its explanation, all-unrated
  outfit with no warning.
- The 1 passing new implementation-gated test is the ISSUE-34
  regression guard: Avoid, Works, unrated hoodies, and unrated
  graphic tees are still rejected in interview builds.

Skipped, not passes, 6 tests:
- 5 shuffle cases: shuffleSlot lives in app/page.tsx (React and
  JSX) and cannot be executed by node:test. Spec level equivalents
  pass, but the React button still needs a browser or manual check.
- 1 outfit card warning case: card rendering is React UI, also
  needs a browser or manual check. Engine explanation warning is
  tested, card warning is not.

## What Agent A must make pass, and what Agent D must check

- After the fix, all 7 failing tests must pass, with no existing
  test edited to hide a failure.
- Browser or manual check required: click Shuffle slot in the
  builder for each violating alternative (extra saturated accent,
  interview hoodie or graphic tee, Avoid item, disliked
  combination) and confirm it is rejected or replaced, only that
  slot changes, and no valid alternative keeps the original with a
  message. Confirm an outfit containing an unrated item shows the
  warning on the outfit card as well as in the explanation, and
  that an all-unrated outfit is not shown as a verified interview
  outfit.
- Diversity message channel: ISSUE-33 does not name it. The test
  accepts a message in the build result, an outfit message field,
  or an explanation line. Agent A must surface it in one of those
  places and document the choice, or route a test change through
  Agent D.
- Unrated warning wording: ISSUE-34 gives the example "Unrated item
  included, palette fit not verified". The engine test accepts any
  warning that names unrated items and says palette fit is not
  verified. Using the example wording exactly is preferred.
- Re-run the ISSUE-31 gate after the fix before merging.

## Secrets and em dashes

- No real credentials, API keys, or passwords are in this branch.
  Placeholders only, matching .env.example. Live runs used the
  local dev server test mode only.
- No em dashes are used in the new tests, the TEST-PLAN update, or
  this PR file, checked by a byte scan for the em dash character.
