# Test plan: spec based test suite

Issues: ISSUE-29 (spec based unit and integration test suite) and ISSUE-30
(contract test skeletons and CI check script, now updated to the Agent B
draft contract). Owner: Agent C.
Branch: test/ISSUE-30-contract-update. Do not merge to main. Agent D merges only.

## How to run

From the repo root, no dependencies to install:

```
sh scripts/check-tests.sh
```

That runs Node built-in test runner (node:test) with plain JavaScript test
files over every file under tests/. It reports total, pass, fail, and pending
(skipped) counts from the node:test summary, and exits 1 if any test fails.

Alternative, direct command:

```
node --test --test-reporter=tap $(find tests -name '*.test.js' | sort)
```

Note: passing a directory to `node --test` is not reliable in this
environment, so the check script passes test files explicitly with find.
That quirk is recorded here so Agent A and Agent B do not reintroduce a
directory argument that fails.

Live API and auth tests in tests/impl-gated/api-and-auth.test.js run only
when CLOSET_TEST_BASE_URL is set to a test server URL. Without it they are
skipped. No real credentials are used anywhere. Placeholders only.

## Status key

- GREEN: a self contained test that validates a spec fixture, a schema, or a
  pure spec rule, and actually passes when run. GREEN does NOT mean
  production code works. Production code does not exist yet for MVP features.
- RED (awaiting implementation): an implementation-gated test that imports
  production code or calls a live server. It is skipped while that code or
  server is missing, and counted as pending, not faked green. When the code
  lands, the test runs for real.
- SKELETON: a contract test that checks skeleton schema and error shape
  only. Paths are to be confirmed against the frozen contract in
  docs/api-contract.md (ISSUE-23, owned by Agent B). No path in a skeleton
  test is final.
- UPDATED TO DRAFT CONTRACT: a contract test updated to the real paths,
  request schemas, response schemas, and error cases in the Agent B draft
  contract in docs/api-contract.md (ISSUE-23). The contract is DRAFT, not
  frozen. Agent D freezes it after this update. Where the contract doc and
  docs/openapi.yaml disagree, the contract doc wins, and the disagreements
  are listed under Blocked below.

## Latest run (2026-10-30, ISSUE-30 contract update, on test/ISSUE-30-contract-update)

- Without CLOSET_TEST_BASE_URL: Total 135, Pass 113, Fail 0, Skipped 22.
  Skipped: outfit engine 5 (Agent A, ISSUE-16), palette ingester 3
  (Agent A, ISSUE-03 and ISSUE-04), live API and auth 14 (impl-gated
  tests gated on CLOSET_TEST_BASE_URL).
- With CLOSET_TEST_BASE_URL=http://localhost:3101 against a local dev
  server (CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js):
  Total 135, Pass 126, Fail 1, Skipped 8 (outfit engine 5, palette
  ingester 3). The single failure is a genuine contract versus
  implementation mismatch, not a test error: POST
  /api/outfits/:outfitId/items with a duplicate item in a free slot
  returns 201 and moves the item, while the contract requires 400.
  See Blocked item 5. No live Supabase project was tested. No live
  project exists.
- Baseline on main before this update (Agent D verified): Total 111,
  Pass 98, Fail 0, Skipped 13. This update adds 24 tests: unit API
  contract 8 to 16, integration API contract 4 to 11, impl-gated API
  and auth 6 to 15.

## Latest run (2026-10-30, ISSUE-32, ISSUE-33, ISSUE-34 fix tests, on test/ISSUE-32-33-34-fix-tests)

This run is on main at cfb03d8 plus only the new test files in this
branch, before the Agent A fix. It is a pre-fix reproduction run, not
a pass claim, and the ISSUE-31 gate is NOT re-run as passing here.
No production code, backend code, or contract file was changed.

- Without CLOSET_TEST_BASE_URL: Total 172, Pass 145, Fail 7, Skipped 20.
  Baseline before this branch (ISSUE-31 gate, non-live): Total 143,
  Pass 129, Fail 0, Skipped 14. This branch adds 29 tests: unit spec
  15, implementation-gated 14. Pass rises by 16 and skipped rises by
  6, which accounts for all 29 new tests except the 7 failures below.
- With CLOSET_TEST_BASE_URL=http://localhost:3101 against a local dev
  server (CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js):
  Total 172, Pass 159, Fail 7, Skipped 6. The live API and auth tests
  that were skipped without a server now pass, so pass rises by 14
  and skipped falls by 14. No new live failure appears.
- The 7 failures are all new implementation-gated fix tests, and all
  fail for the documented pre-fix reason on main, not for a test
  construction error:
  - ISSUE-33 diversity, 3 tests: a one-pair wardrobe returns 3 outfits
    sharing the same top and outer pair, a two-pair wardrobe returns
    3 outfits with a repeat, and fewer outfits carry no message.
  - ISSUE-34 interview unrated, 4 tests: a score 99 unrated top is
    sorted before a rated top, the same happens for a missing
    paletteVerdict, an unrated fallback top has no warning in its
    explanation, and an all-unrated outfit has no warning and no
    not-verified signal.
- The 1 passing new implementation-gated test is the ISSUE-34
  regression guard: Avoid, Works, unrated hoodies, and unrated
  graphic tees are still rejected in interview builds.
- The 6 skipped new tests are UI only and are not passes: 5 shuffle
  cases in app/page.tsx and 1 outfit card warning case. shuffleSlot
  and the outfit card are React code that node:test cannot execute.
  Their spec level equivalents pass in the unit file, but the React
  button and card still need a browser or manual check, flagged in
  the PR file for this branch. Do not count a skipped shuffle or card
  test as a shuffle or card pass.
- After the Agent A fix, these 7 failures must become passes, the 6
  skipped UI cases must be checked in a browser or manually, and the
  ISSUE-31 gate must be re-run before Agent D merges. Until then,
  this branch must not be merged as a green suite.

## Latest run (2026-10-30, before any feature code)

- Total: 98
- Pass: 79
- Fail: 0
- Pending (skipped, RED): 19
- Spec GREEN passes: 74 (58 unit plus 16 integration)
- Implementation-gated marker passes: 5. These markers only record gate
  state. They are not feature passes.
- Implementation-gated skipped: 19 (4 rating, 5 outfit engine, 3 palette
  ingester, 2 advice rules, 5 API and auth)

## Source of truth

Build spec: ~/workspace/your_files/closet-app-mvp-build-spec.md, sections 1
to 16. That spec is authoritative. No feature outside it is tested here.

Settled choices used by these tests, not changed by them:

- Next.js frontend, TypeScript, Tailwind, PWA only, no Play Store in MVP.
- Supabase for user, item, and outfit data, Supabase Storage first, with a
  StorageProvider abstraction for a possible later move to Cloudflare R2 or
  home server MinIO.
- Browser rule engine using pruned beam search in a Web Worker, using
  precomputed item data from the API.
- Home server LLM only as optional Phase 2 advisor via Ollama 3B over
  Tailscale, never the outfit decider.
- Physical location is out of MVP except for a nullable field.
- No paid API is required for core features. Single user personal app, free
  tiers only.
- Auth: Google Auth via Supabase Auth, kept simple.

## Test files

- tests/fixtures/spec-data.js: spec tables (palette, avoid rules, beauty
  sections, starting advice rules, rating cases, API resources and fields).
  Not production code. Production code must not import it.
- tests/helpers/spec-rules.js: spec oracle restating spec formulas (rating
  score, tiers, avoid cap, secondary clash, saturation rules, hard rule
  classifier, dislike window, enabled only scoring, palette summary). Not
  production code. Production code must not import it.
- tests/unit/: spec unit tests, GREEN.
- tests/integration/: spec flow tests, GREEN.
- tests/impl-gated/: production and live server tests, RED (skipped).

## Mapping: unit tests

### tests/unit/palette-ingester.test.js, 10 tests, GREEN, ISSUE-29, spec 4, 11.1, 15

- palette ingester: core colours from spec section 15 are present, GREEN, spec 15, ISSUE-29
- palette ingester: neutrals from spec section 15 are present, GREEN, spec 15, ISSUE-29
- palette ingester: avoid rules cover light pastels, warm oranges, muted earthy hues, GREEN, spec 4.4 and 15, ISSUE-29
- palette ingester: beauty sections are classified as ignore, GREEN, spec 4.3 step 1, ISSUE-29
- palette ingester: makeup, blush, lip, hair colours are never saved as clothing colours unless explicitly added, GREEN, spec 2, 4.3, 11.1, ISSUE-29
- palette ingester: Remove beauty colours deletes beauty tagged colours and can be undone in state, GREEN, spec 4.3 step 4, ISSUE-29
- palette ingester: correction can rename, change role, change hex, delete, and add, GREEN, spec 4.3 step 4, ISSUE-29
- palette ingester: summary warns if zero neutrals or zero avoids, GREEN, spec 4.3 step 4, ISSUE-29
- palette ingester: every extracted colour keeps a source page, GREEN, spec 4.3 step 1, ISSUE-29
- palette ingester: new palette version does not delete items in state, GREEN, spec 4.1 and 4.3 step 5, ISSUE-29

### tests/unit/item-rating.test.js, 13 tests, GREEN, ISSUE-29, spec 5.3, 11.2

- rating: score equals 100 minus Delta E times 2, clamped 0 to 100, GREEN, spec 5.3, ISSUE-29
- rating: tiers are Perfect 90 to 100, Strong 70 to 89, Works 50 to 69, Avoid 0 to 49, GREEN, spec 5.3, ISSUE-29
- rating: Delta E under 5 gives 90 or above, GREEN, spec 5.3, ISSUE-29
- rating: avoid cap sets verdict to Avoid and caps score at 40 regardless of Delta E, GREEN, spec 5.3, ISSUE-29
- rating: secondary clash over 25 percent minus 15 points and flagged, GREEN, spec 5.3, ISSUE-29
- rating: neutral saturation cap, neutrals are not penalised for low saturation, GREEN, spec 5.3, ISSUE-29
- rating: core saturation penalty, much less saturated core loses 10 points, GREEN, spec 5.3, ISSUE-29
- rating: full spec pipeline for multi colour navy base with warm orange stripe over 25 percent, GREEN, spec 5.3 and 11.2, ISSUE-29
- rating: full spec pipeline for warm orange hoodie near true red still Avoid, GREEN, spec 5.3 and 11.2, ISSUE-29
- rating: spec section 11.2 concrete cases have allowed verdicts and score ranges, GREEN, spec 11.2, ISSUE-29
- rating: white collared shirt is Strong neutral, not Avoid, GREEN, spec 3 and 11.2, ISSUE-29
- rating: every rating must store score, nearest colour, verdict, and reason, GREEN, spec 5.3, ISSUE-29
- rating: manual override is stored separately and does not overwrite auto score, GREEN, spec 5.4, ISSUE-29

Concrete cases covered in the fixture table, spec 11.2: white collared
shirt Strong neutral, navy sweater Perfect or Strong, emerald knit Perfect
or Strong, warm orange hoodie Avoid, light pastel tee Avoid, muted olive
or camel Avoid or Works as accent only at most, multi colour navy base
with warm orange stripe over 25 percent score reduced and secondary clash
flagged.

### tests/unit/outfit-builder.test.js, 14 tests, GREEN, ISSUE-29, spec 6.2, 6.3, 6.4, 6.7, 11.3

- outfit builder: valid daily outfit has no hard rule violations, GREEN, spec 6.2, ISSUE-29
- outfit builder: no two outer layers, GREEN, spec 6.2 and 11.3, ISSUE-29
- outfit builder: no two bottoms, GREEN, spec 6.2 and 11.3, ISSUE-29
- outfit builder: no two pairs of shoes, GREEN, spec 6.2 and 11.3, ISSUE-29
- outfit builder: max one saturated accent as a main colour, GREEN, spec 6.2 and 11.3, ISSUE-29
- outfit builder: archived or stored items excluded, only in rotation used, GREEN, spec 3, 6.3 step 1, 11.3, ISSUE-29
- outfit builder: interview only Perfect and Strong, no hoodies or graphic tees, GREEN, spec 6.4 and 11.3, ISSUE-29
- outfit builder: interview prefers white or light neutral collared shirt if available, GREEN, spec 6.4, ISSUE-29
- outfit builder: formal allows one saturated accent, GREEN, spec 6.4, ISSUE-29
- outfit builder: diversity of 3 outfits, no shared top and outer pair, GREEN, spec 6.3 step 4 variety and 11.3, ISSUE-29
- outfit builder: dislike prevents exact same combination for 30 days, then allows it, GREEN, spec 6.1, 6.7, 11.3, ISSUE-29
- outfit builder: logging worn increments wear count for every item, GREEN, spec 6.7 and 11.3, ISSUE-29
- outfit builder: every outfit has at most one of each slot, empty slots allowed, GREEN, spec 6.2, ISSUE-29
- outfit builder: each outfit shows palette, fit, and contrast reasoning, GREEN, spec 3 and 6.3 step 5, ISSUE-29

### tests/unit/advice-rules.test.js, 7 tests, GREEN, ISSUE-29, spec 6.5

- advice rules: starting rules from spec section 6.5 are present as editable records, GREEN, spec 6.5, ISSUE-29
- advice rules: every starting rule has condition, action, reason, source, and enabled flag, GREEN, spec 6.5, ISSUE-29
- advice rules: all starting rules start enabled, GREEN, spec 6.5, ISSUE-29
- advice rules: a disabled rule must never affect scoring, GREEN, spec 6.5, ISSUE-29
- advice rules: neckline rule is a preference, not a hard filter, GREEN, spec 6.5 rule 10, ISSUE-29
- advice rules: user can edit, disable, and delete a rule in state, GREEN, spec 6.5 and section 3, ISSUE-29
- advice rules: silver over gold is in the starting set, GREEN, spec 6.5 rule 9, ISSUE-29

Starting rules covered, spec 6.5: shoulders first, fitted base arms,
relaxed outer body, straight or tapered trousers, contrast, cool colours,
one soft detail, silver over gold, plus sleeve fit and neckline.

### tests/unit/auth.test.js, 6 tests, GREEN, ISSUE-29, spec 9, 16.2, 16.3, ISSUE-20, ISSUE-21

- auth: Google Auth via Supabase Auth is the settled auth method, GREEN, spec 16.3, ISSUE-20
- auth: unauthenticated API requests are rejected with 401, GREEN, spec 16 and api-contract placeholder, ISSUE-21
- auth: wrong owner requests are rejected with 403, GREEN, spec 16.3 RLS, ISSUE-21
- auth: protected routes redirect unauthenticated users, API routes return 401, GREEN, ISSUE-20 and ISSUE-21
- auth: RLS must be enforced on user_id for every table, GREEN, spec 16.3, ISSUE-21
- auth: no service role key in client code is a spec rule, GREEN, spec 16.2, ISSUE-20

### tests/unit/api-contract.test.js, 16 tests, UPDATED TO DRAFT CONTRACT, ISSUE-30, spec 8, ISSUE-23

- api contract draft: endpoint table has all 52 contract endpoints, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: auth session and profile paths and shapes, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: palette paths, create shape, versioning and rerate, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: palette colour paths, enums, hex rule, and derivation, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: avoid rule paths, required ranges, and starting rules, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: item paths, enums, and lifecycle shapes, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: item colours replace the full set, max 3, one primary, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: uploads accept WebP only, with kind width limits, and signed URLs, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: outfit paths, enums, duplicate rules, and missing item distinction, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: wear log paths, required fields, and delete effects, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: advice rule paths, required fields, and seed idempotency, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: export is a POST returning a ZIP, not JSON, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: single JSON error shape and full error code table, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: auth rules, ownership order, validation rules, and pagination, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: contract doc wins over openapi, disagreements recorded, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract draft: no skeleton placeholders remain in this file, UPDATED TO DRAFT CONTRACT, ISSUE-30

All 52 paths are the real Agent B draft contract paths, including
GET /api/auth/session, GET and PATCH /api/profile, palette activate,
versions, and rerate, palette colours, avoid rules, item restore and
permanent-delete, item colours, POST /api/uploads and
POST /api/uploads/signed-url, GET /api/storage/:path (local dev server
only), outfit items, wear logs, advice rules seed, and POST /api/export.
The contract is DRAFT, not frozen. Agent D freezes it after this update.

### tests/unit/shuffle-diversity-interview-fix.test.js, 15 tests, GREEN spec oracle, ISSUE-32, ISSUE-33, ISSUE-34, spec 6.1, 6.2, 6.3, 6.4

These are spec level oracle tests. They use production classification
helpers (slotForCategory, isSaturatedAccent, isDisliked) but the
shuffle selection rule itself is restated in the test file, because
shuffleSlot is React code that node:test cannot execute. They are
GREEN, but they are not proof that the React shuffle button works.
That proof is the skipped implementation-gated shuffle tests below
plus a browser or manual check.

- shuffle fix ISSUE-32: a would-be second saturated accent is rejected and replaced with a valid alternative, GREEN spec oracle, spec 6.2, ISSUE-32
- shuffle fix ISSUE-32: an interview excluded category is rejected and replaced with a valid alternative, GREEN spec oracle, spec 6.4, ISSUE-32
- shuffle fix ISSUE-32: an Avoid verdict alternative is rejected and replaced with a valid alternative, GREEN spec oracle, spec 6.3, ISSUE-32
- shuffle fix ISSUE-32: a disliked combination is rejected and replaced with a valid alternative, GREEN spec oracle, spec 6.1 and 6.7, ISSUE-32
- shuffle fix ISSUE-32: shuffle replaces only that slot, other items are unchanged, GREEN spec oracle, spec 6.1, ISSUE-32
- shuffle fix ISSUE-32: when no valid alternative exists, the original outfit is kept with a message, GREEN spec oracle, spec 6.1, ISSUE-32
- shuffle fix ISSUE-32 and ISSUE-34: an unrated interview alternative is a fallback only, with a warning, GREEN spec oracle, spec 6.4, ISSUE-32, ISSUE-34
- diversity fix ISSUE-33: three outfits with distinct top and outer pairs are valid, GREEN spec oracle, spec 6.3 step 4 variety, ISSUE-33
- diversity fix ISSUE-33: a small wardrobe result with fewer outfits is valid only with a message, GREEN spec oracle, spec 6.3 step 4 variety, ISSUE-33
- diversity fix ISSUE-33: repeated top and outer pairs are never valid, even with a message, GREEN spec oracle, spec 6.3 step 4 variety, ISSUE-33
- interview unrated ISSUE-34: rated items are sorted first, unrated only as a fallback with a warning in card and explanation, GREEN spec oracle, spec 6.4, ISSUE-34
- interview unrated ISSUE-34: an outfit made only of unrated items must not be presented as a verified interview outfit, GREEN spec oracle, spec 6.4, ISSUE-34
- interview unrated ISSUE-34: Avoid, Works, hoodies, and graphic tees are still rejected in interview builds, GREEN spec oracle, spec 6.4, ISSUE-34
- interview unrated ISSUE-34: a missing paletteVerdict is treated the same as a null paletteVerdict, never as Strong, GREEN spec oracle, spec 6.4, ISSUE-34
- interview unrated ISSUE-34: unrated items are allowed, not excluded outright, when they are the fallback, GREEN spec oracle, spec 6.4, ISSUE-34

### tests/impl-gated/fix-ISSUE-32-33-34.test.js, 14 tests: 1 pass, 7 fail pre-fix, 6 skipped UI, ISSUE-32, ISSUE-33, ISSUE-34, spec 6.1, 6.3, 6.4

These import the production engine buildOutfits, except for the
skipped UI cases. On main at cfb03d8, before the Agent A fix, the 7
running diversity and unrated tests fail as pre-fix reproductions.
They must pass after the fix. The 6 skipped tests are not passes.

- fix ISSUE-32 shuffle: extra saturated accent alternative is rejected or replaced, SKIPPED UI, spec 6.2, ISSUE-32
- fix ISSUE-32 shuffle: interview excluded category alternative is rejected or replaced, SKIPPED UI, spec 6.4, ISSUE-32
- fix ISSUE-32 shuffle: Avoid verdict alternative is rejected or replaced, SKIPPED UI, spec 6.3, ISSUE-32
- fix ISSUE-32 shuffle: disliked combination alternative is rejected or replaced, SKIPPED UI, spec 6.1 and 6.7, ISSUE-32
- fix ISSUE-32 shuffle: shuffle replaces only that slot, and keeps the original when no valid alternative exists, SKIPPED UI, spec 6.1, ISSUE-32
- fix ISSUE-33 diversity: a small wardrobe with one top and outer pair never returns silent repeats, FAILS PRE-FIX, spec 6.3 step 4 variety, ISSUE-33
- fix ISSUE-33 diversity: a small wardrobe with two distinct pairs returns at most two outfits, never a repeat, FAILS PRE-FIX, spec 6.3 step 4 variety, ISSUE-33
- fix ISSUE-33 diversity: fewer than 3 outfits must carry a message about the shortfall, FAILS PRE-FIX, spec 6.3 step 4 variety, ISSUE-33
- fix ISSUE-34 interview unrated: a score 99 unrated top must not be sorted before a rated top, FAILS PRE-FIX, spec 6.4, ISSUE-34
- fix ISSUE-34 interview unrated: a missing paletteVerdict is treated the same as null, never as Strong, FAILS PRE-FIX, spec 6.4, ISSUE-34
- fix ISSUE-34 interview unrated: an unrated top is allowed only as a fallback, with a warning in the explanation, FAILS PRE-FIX, spec 6.4, ISSUE-34
- fix ISSUE-34 interview unrated: an all-unrated outfit is allowed only with a warning, and is never presented as verified, FAILS PRE-FIX, spec 6.4, ISSUE-34
- fix ISSUE-34 interview unrated: Avoid, Works, unrated hoodies, and unrated graphic tees are still rejected, PASS, spec 6.4, ISSUE-34
- fix ISSUE-34 interview unrated: warning appears in the outfit card as well as the explanation, SKIPPED UI, spec 6.4, ISSUE-34

Notes on test design, so a future fix does not need to guess:
- The diversity message test accepts a message in the build result,
  an outfit message field, or an explanation line that mentions a
  distinct pair, diversity, fewer outfits, or a small wardrobe. It
  does not invent one exact field name, because ISSUE-33 does not
  name the message channel. The Agent A fix must surface a message
  in one of those places, or update this test through Agent D with
  the chosen channel documented.
- The unrated warning test accepts any explanation warning that
  names unrated items and says palette fit is not verified, because
  ISSUE-34 gives the warning wording as an example, not as an exact
  string. The outfit card warning is UI only and is not checked by
  the engine test.
- An all-unrated outfit is checked as not verified by requiring the
  warning in the explanation and by asserting no verified flag is
  true on the outfit. The engine returns no verified flag today, so
  the warning is the operative not-verified signal at engine level,
  and the card must not show a verified badge, which is the skipped
  UI check.

## Mapping: integration tests

### tests/integration/palette-flow.test.js, 4 tests, GREEN, ISSUE-29, spec 4.3

- palette flow: correction screen shows every colour with name, role, source page, and hex, GREEN, spec 4.3 step 4
- palette flow: save summary counts core, neutral, and avoid before saving, GREEN, spec 4.3 step 4
- palette flow: saving a new palette re-rates items, old version is kept, GREEN, spec 4.3 step 5
- palette flow: unnamed swatch and text only named colour are both supported, GREEN, spec 4.3 step 3

### tests/integration/outfit-flow.test.js, 5 tests, GREEN, ISSUE-29, spec 6.1, 6.3, 6.7, 11.3

- outfit flow: daily build returns 3 outfits with different top and outer pairs, GREEN, spec 6.3 and 11.3
- outfit flow: save outfit stores items, scores, and occasion, GREEN, spec 6.7
- outfit flow: log worn records wear log and increments every item wear count, GREEN, spec 6.7 and 11.3
- outfit flow: dislike stores exact combination and reason, items are not deleted, GREEN, spec 6.7
- outfit flow: shuffle one slot replaces only that slot, GREEN, spec 6.1

### tests/integration/api-contract.test.js, 11 tests, UPDATED TO DRAFT CONTRACT, ISSUE-30, spec 8, ISSUE-23

- api contract integration draft: every resource has its contract CRUD matrix, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: error cases map to one consistent shape with all six codes, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: auth flow, API returns 401 not a redirect, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: palette lifecycle, activate, versions, rerate, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: item lifecycle, soft delete, restore, permanent delete, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: outfit and wear log flows share item and outfit ids, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: upload flow stores paths, never signed URLs, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: advice seed and enabled filter flow, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: export returns ZIP, errors still return JSON shape, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: pagination envelope and list versus single shapes, UPDATED TO DRAFT CONTRACT, ISSUE-30
- api contract integration draft: live proof lives in impl-gated tests, not here, UPDATED TO DRAFT CONTRACT, ISSUE-30

These are self contained flow expectations against the draft contract.
They do not call a live server. Live proof is in
tests/impl-gated/api-and-auth.test.js.

### tests/integration/auth-flow.test.js, 3 tests, GREEN, ISSUE-29, ISSUE-20, ISSUE-21

- auth flow: home screen is the outfit builder after login, GREEN, spec 6.1
- auth flow: unauthenticated user cannot reach protected screens, GREEN, ISSUE-20
- auth flow: authenticated owner can reach protected screens, GREEN, ISSUE-20

## Mapping: implementation-gated tests (RED)

These tests are skipped until production code or a server exists. They are
not green, and Agent D must not treat the suite as a feature gate pass for
Agents A or B until these tests run for real and pass.

### tests/impl-gated/rating-engine.test.js, 5 tests: 1 marker pass, 4 skipped, RED, ISSUE-10, spec 5.3

- impl rating: white collared shirt rates Strong neutral, not Avoid, RED
- impl rating: navy sweater rates Perfect or Strong, RED
- impl rating: warm orange hoodie rates Avoid with warm orange reason, RED
- impl rating: multi colour navy base with warm orange stripe over 25 percent is reduced and flagged, RED
- impl rating: module exists marker, marker pass only, records gate state

### tests/impl-gated/outfit-engine.test.js, 6 tests: 1 marker pass, 5 skipped, RED, ISSUE-16, spec 6.3, 16.6

- impl outfit engine: engine module exists and exposes a build function, RED
- impl outfit engine: daily build returns 3 outfits with no shared top and outer pair, RED
- impl outfit engine: builder never returns two outers, two bottoms, two shoes, or two main accents, RED
- impl outfit engine: interview build returns only Perfect and Strong, no hoodies or graphic tees, RED
- impl outfit engine: disliked combination blocked for 30 days, RED
- impl outfit engine: gate state marker, marker pass only

### tests/impl-gated/palette-ingester.test.js, 4 tests: 1 marker pass, 3 skipped, RED, ISSUE-03, ISSUE-04, spec 4

- impl palette ingester: extracts core, neutral, and avoid sections from a PDF, RED
- impl palette ingester: never saves makeup, blush, lip, or hair colours unless explicitly added, RED
- impl palette ingester: correction and Remove beauty colours are supported, RED
- impl palette ingester: gate state marker, marker pass only

### tests/impl-gated/advice-rules.test.js, 3 tests: 1 marker pass, 2 skipped, RED, ISSUE-15, spec 6.5

- impl advice rules: starting rules are present as editable records, RED
- impl advice rules: disabled rule never affects scoring, RED
- impl advice rules: gate state marker, marker pass only

### tests/impl-gated/api-and-auth.test.js, 15 tests: 1 marker pass, 14 live (skipped without CLOSET_TEST_BASE_URL), UPDATED TO DRAFT CONTRACT, ISSUE-20, ISSUE-21, ISSUE-23, ISSUE-30

- impl api: unauthenticated requests return 401, API does not redirect, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: session and profile work, profile auto created, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: wrong owner returns 403 and missing resource returns 404, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: invalid input returns 400 with single consistent JSON error shape and details, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: method not listed for a path returns 405, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: palette, colour, and avoid rule CRUD with embedded single read, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: palette activate, versions, and rerate, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: item CRUD, colours replace, manual score, and soft delete lifecycle, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: outfit CRUD, duplicate slot, outfit items, and missing item distinction, UPDATED TO DRAFT CONTRACT, ISSUE-30. Live run fails on this test only, because of the duplicate item mismatch in Blocked item 5. The test follows the contract and was not changed to hide the mismatch.
- impl api: wear log increments counts and delete decrements without rewriting lastWornAt, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: advice rules CRUD and seed idempotency, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: uploads accept WebP only, signed URL serves file, storage without token is 401, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: export returns a ZIP for an authenticated user, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api: pagination envelope and pageSize clamping, UPDATED TO DRAFT CONTRACT, ISSUE-30
- impl api and auth: gate state marker, marker pass only

All paths in this file are real draft contract paths. Without
CLOSET_TEST_BASE_URL the 14 live tests are skipped and the marker
passes. With CLOSET_TEST_BASE_URL set to a local dev server, 13 of the
14 live tests pass and 1 fails on the documented mismatch in Blocked
item 5. No live Supabase project was tested.

## What is NOT tested here, and why

- Real PDF parsing, real background removal, real photo colour clustering,
  real PWA offline behaviour, and real performance on Android (spec 11.4).
  Those need production code, a device, or a built app, and belong in later
  Agent C passes (ISSUE-31) once Agents A and B land code. They are not
  faked here with fixtures.
- Exact production function signatures. Those are Agent A and Agent B
  decisions, routed through Agent D.
- The frozen API contract. Contract tests are now updated to the Agent B
  draft contract (ISSUE-23), not to a frozen contract. docs/api-contract.md
  and docs/openapi.yaml were not changed by Agent C. Agent D freezes the
  contract after this update. Contract versus OpenAPI disagreements found
  by Agent C are listed in Blocked item 4, with the contract doc winning.

## Blocked

1. Frozen API contract missing (ISSUE-23, owned by Agent B, drafted but
   not frozen). Impact: contract tests are UPDATED TO DRAFT CONTRACT,
   not to a frozen contract. Paths, request and response schemas, and
   error shape now match the draft in docs/api-contract.md, but Agent D
   has not frozen it yet, so a later freeze change would need another
   Agent C update. Action for Agent D: freeze the contract, or route any
   freeze change to Agent C for a test update. Do not guess a contract
   change.
4. Contract versus OpenAPI disagreements (Agent B owns both files,
   correction through Agent D). Agent C changed neither file. The
   contract doc wins in every case below, per Agent B report, and the
   updated tests follow the contract doc:
   a. GET /api/storage/:path is in the contract table but has no path
      entry in docs/openapi.yaml.
   b. 405 METHOD_NOT_ALLOWED is in the contract error table but no 405
      response appears in docs/openapi.yaml.
   c. List query params in the contract are missing from
      docs/openapi.yaml: palettes isActive and sort, palette colours
      sort, avoid rules sort, item colours and outfit items pagination.
   d. Contract list responses exclude embedded children (palettes list
      without colours and avoidRules, items list without colours,
      outfits list without items), but docs/openapi.yaml reuses the
      full Palette, Item, and Outfit schemas for list responses. The
      local implementation follows the contract doc on this point,
      verified by live probe.
   e. Upload width and height maxima in the contract (image 1200,
      thumbnail 400, height 4000) and the 5MB decoded size limit are
      missing from docs/openapi.yaml UploadCreate, which only sets
      minimum 1.
   f. Contract page and pageSize out of range values are clamped, but
      docs/openapi.yaml PageSize bounds (1 to 100) read as rejection
      rather than clamping. Non numeric values are 400 in the contract.
   g. Outfit item delete response in the contract is
      { deleted, outfitId, itemId }, but docs/openapi.yaml Deleted
      schema only has deleted, id, and softDeleted.
   h. Export Content-Disposition filename pattern
      closet-export-<date>.zip is in the contract but not specified
      in docs/openapi.yaml.
   i. PaletteColour labL range 0 to 100 in the contract has no min or
      max in docs/openapi.yaml PaletteColourCreate.
5. Contract versus implementation mismatch, POST
   /api/outfits/:outfitId/items duplicate item (Agent B owns the
   implementation, routing through Agent D). Expected per contract:
   adding an item already in the outfit returns 400 VALIDATION_ERROR,
   on this endpoint as well as on POST /api/outfits. Actual on the
   local dev server: adding the same item in a free slot returns 201
   and moves the item to the new slot, keyed by itemId, so the outfit
   ends with one entry in the new slot and the old slot entry is gone.
   Duplicate slot with a different item correctly returns 400, and
   POST /api/outfits create correctly returns 400 for a duplicate
   item, so only the outfit items endpoint duplicate item check is
   missing. Impact: the impl-gated outfit test fails in live runs
   (full live run: 1 fail of 135) until this is fixed. The test was
   not changed to hide the mismatch. Recommendation: Agent B adds a
   duplicate item check to POST /api/outfits/:outfitId/items returning
   400 VALIDATION_ERROR before any upsert, matching the create
   endpoint, then Agent C re-runs the live check. Agent D decides
   whether to merge this test branch before or after that fix, since
   the unserved check passes (113 pass, 0 fail) but the live check
   does not.
6. Remaining skeleton items: none in the three contract test files.
   All skeleton paths, request schemas, response schemas, and error
   cases in tests/unit/api-contract.test.js,
   tests/integration/api-contract.test.js, and
   tests/impl-gated/api-and-auth.test.js are updated to the draft
   contract. Remaining skipped items are unchanged: outfit engine 5
   (Agent A, ISSUE-16), palette ingester 3 (Agent A, ISSUE-03 and
   ISSUE-04), and live API and auth 14 without CLOSET_TEST_BASE_URL.
7. Production function signatures missing. Impact: implementation-gated
   tests in tests/impl-gated/ are interface skeletons that check module
   presence, not full production behaviour, because Agent A and Agent B
   have not defined the rating, outfit engine, palette ingester, or advice
   rule function signatures yet. Action for Agent D: when Agents A and B
   define those signatures, route them to Agent C to tighten the gated
   tests with real inputs and expected outputs before merging feature code.
8. No live Supabase project exists. Impact: live API and auth tests run
   against the local dev server only (CLOSET_TEST_MODE=1, test tokens),
   and are skipped unless CLOSET_TEST_BASE_URL is set. Supabase backed
   behaviour is untested. Action for Agent D: accept that ISSUE-31 covers
   the live Supabase gate.
9. No missing decision was guessed. No spec change and no contract change
   is proposed in this branch. Agent C changed no production code and no
   contract file.

10. Fix run open items for Agent D (ISSUE-32, ISSUE-33, ISSUE-34, this
branch). Impact: the React shuffle button in app/page.tsx and the
outfit card warning cannot be executed by node:test, so 6 new tests
are skipped and are not passes. The spec level shuffle and unrated
oracle tests pass, and the engine diversity and unrated tests fail
pre-fix as documented above, but the button and card still need a
browser or manual check after the Agent A fix. Also, ISSUE-33 does
not name the channel for the fewer outfits message, and ISSUE-34
gives the warning wording as an example, so the new tests accept
several message channels and any warning that names unrated items
and says palette fit is not verified, rather than inventing one
exact field or string. Action for Agent D: arrange the browser or
manual shuffle and card checks, confirm the message channel chosen
by Agent A, and re-run the ISSUE-31 gate after the fix before
merging. Do not merge this branch as a green suite while the 7
pre-fix failures stand.

## No secrets, no em dashes

- No real Supabase credentials, API keys, or passwords are in this branch.
  Placeholders only, matching .env.example.
- No em dashes are used in tests, scripts, or docs in this branch.
