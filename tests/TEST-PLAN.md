# Test plan: spec based test suite

Issues: ISSUE-29 (spec based unit and integration test suite) and ISSUE-30
(contract test skeletons and CI check script). Owner: Agent C.
Branch: test/ISSUE-29-spec-test-suite. Do not merge to main. Agent D merges only.

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

### tests/unit/api-contract.test.js, 8 tests, GREEN as SKELETON, ISSUE-30, spec 8, ISSUE-23

- api contract skeleton: all spec section 8 resources are listed, SKELETON, spec 8, ISSUE-30
- api contract skeleton: each resource has a field list from spec section 8, SKELETON, spec 8, ISSUE-30
- api contract skeleton: items keep nullable location field only, not a location flow, SKELETON, spec 3 and 8, ISSUE-30
- api contract skeleton: request and response schemas use the same resource fields, SKELETON, spec 8, ISSUE-30
- api contract skeleton: validation errors return 400 for invalid input, SKELETON, ISSUE-26 and ISSUE-30
- api contract skeleton: 401 unauthenticated, 403 wrong owner, 404 missing resource, SKELETON, ISSUE-30
- api contract skeleton: single consistent JSON error shape, candidate only, not frozen, SKELETON, ISSUE-26 and ISSUE-30
- api contract skeleton: paths are to be confirmed against the frozen contract, SKELETON, ISSUE-23 and ISSUE-30

Resource names used, spec 8: palettes, palette colours, avoid rules,
items, item colours, advice rules, outfits, outfit items, wear logs.
Paths are to be confirmed against the frozen contract. No path in these
tests is final.

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

### tests/integration/api-contract.test.js, 4 tests, GREEN as SKELETON, ISSUE-30, spec 8, ISSUE-23

- api contract integration skeleton: every resource has CRUD expectations in skeleton, SKELETON, spec 8
- api contract integration skeleton: error cases map to one consistent shape, SKELETON, ISSUE-26
- api contract integration skeleton: unauthenticated live calls are pending, not faked, SKELETON, ISSUE-30
- api contract integration skeleton: paths are to be confirmed against the frozen contract, SKELETON, ISSUE-23

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

### tests/impl-gated/api-and-auth.test.js, 6 tests: 1 marker pass, 5 skipped, RED, ISSUE-20, ISSUE-21, ISSUE-23, ISSUE-30

- impl api: unauthenticated request returns 401, RED, SKELETON path, to be confirmed
- impl api: wrong owner request returns 403, RED, SKELETON path, to be confirmed
- impl api: missing resource returns 404, RED, SKELETON path, to be confirmed
- impl api: invalid input returns 400 with single consistent JSON error shape, RED, SKELETON path, to be confirmed
- impl auth: protected route redirects unauthenticated users, API returns 401, RED
- impl api and auth: gate state marker, marker pass only

Paths in this file are placeholders to be confirmed against the frozen
contract. They are not final endpoints.

## What is NOT tested here, and why

- Real PDF parsing, real background removal, real photo colour clustering,
  real PWA offline behaviour, and real performance on Android (spec 11.4).
  Those need production code, a device, or a built app, and belong in later
  Agent C passes (ISSUE-31) once Agents A and B land code. They are not
  faked here with fixtures.
- Exact API paths, exact production function signatures, and exact JSON
  error shape wording. Those are Agent B decisions in the frozen contract
  (ISSUE-23), routed through Agent D. Skeleton tests check the shape
  concept, not the final wording.
- docs/api-contract.md was not changed into a final contract. That file
  stays a placeholder owned by Agent B. Only skeleton notes were added in
  tests, not a frozen contract.

## Blocked

1. Frozen API contract missing (ISSUE-23, owned by Agent B, not yet
   written). Impact: all contract tests are skeletons. Paths, exact
   request and response schemas, and exact error shape wording cannot be
   finalised until Agent B drafts the contract and Agent D freezes it.
   Action for Agent D: route ISSUE-23 to Agent B, then ask Agent C to
   update skeleton tests to match the frozen contract. Do not guess a
   spec change.
2. Production function signatures missing. Impact: implementation-gated
   tests in tests/impl-gated/ are interface skeletons that check module
   presence, not full production behaviour, because Agent A and Agent B
   have not defined the rating, outfit engine, palette ingester, or advice
   rule function signatures yet. Action for Agent D: when Agents A and B
   define those signatures, route them to Agent C to tighten the gated
   tests with real inputs and expected outputs before merging feature code.
3. No test server exists. Impact: live API and auth tests are skipped
   unless CLOSET_TEST_BASE_URL is set. Action for Agent D: provide a test
   server target when backend code lands, or accept that ISSUE-31 covers
   the live gate.
4. No missing decision was guessed. No spec change is proposed in this
   branch.

## No secrets, no em dashes

- No real Supabase credentials, API keys, or passwords are in this branch.
  Placeholders only, matching .env.example.
- No em dashes are used in tests, scripts, or docs in this branch.
