# Integration gate report, ISSUE-31

Branch: test/ISSUE-31-integration-gate. This report is the Agent C gate
for the merged Agent A frontend and Agent B backend on main. It does not
claim the MVP is done. Verdict: GATE FAILS. See the verdict section.

No production code was changed for this gate. No file under lib/, app/,
components/, supabase/, or scripts/dev-server.js was edited, and neither
docs/api-contract.md nor docs/openapi.yaml was edited. The only new
production-adjacent file is the gate test file listed below, plus this
report and the PR description file.

## Test results, exact counts

Command: sh scripts/check-tests.sh, from the repo root.

Non-live, without CLOSET_TEST_BASE_URL:
- Total 143, pass 129, fail 0, skipped 14.
- The 14 skipped tests are live API and auth tests only. They pass when
  the dev server URL is set, as shown below.
- Baseline on main before this gate (verified by Agent D): total 135,
  pass 121, fail 0, skipped 14. This gate adds 8 tests, so the total
  rises by 8 and the pass count rises by 8. No existing test was edited
  to hide a failure.

Live, against a local dev server:
- Server: CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js.
- Client: CLOSET_TEST_BASE_URL=http://localhost:3101 sh scripts/check-tests.sh.
- Total 143, pass 143, fail 0, skipped 0.
- This reproduces and extends Agent D's final Agent A branch result
  (135 total, 135 pass, 0 skipped) with the 8 new gate tests included.

Gated tests, called out explicitly:
- Duplicate outfit item case: POST /api/outfits/:outfitId/items with a
  duplicate item now returns 400 VALIDATION_ERROR with details
  { items: "Duplicate item in one outfit." }, verified both by the live
  suite and by a manual curl probe in this gate. The earlier ISSUE-13
  bug is fixed and stays fixed.
- Outfit engine gated tests (ISSUE-16): the 5 original skeleton tests
  now pass, and this gate adds real wardrobe tests in
  tests/impl-gated/gate-ISSUE-31.test.js. Daily build returns 3 outfits
  with distinct top and outer pairs, hard rules hold on the build path,
  interview returns only Perfect and Strong with no hoodies or graphic
  tees and the white collared shirt first, a fresh dislike blocks the
  exact combination, and a 31 day old dislike no longer blocks it.
- Palette ingester gated tests (ISSUE-03, ISSUE-04): the 3 original
  skeleton tests now pass, and this gate adds real page text tests.
  Core, neutral, and avoid sections extract with source pages, a beauty
  page produces no clothing colour, and correction helpers (rename,
  change role, change hex, delete, Remove beauty colours with undo
  state) work. Real PDF binary parsing and swatch sampling are NOT
  covered by these tests. See the unproven items below.

Frontend build, verified in this gate:
- npm run build exited 0 on this branch. Routes built: /, /wardrobe,
  /items/new, /items/[id], /items/[id]/edit, /palette,
  /palette/correct, /advice-rules, /outfits, /outfits/[id], /settings,
  /sign-in, /auth/callback, and the API route /api/[...path]. This
  confirms Agent A's build claim in this environment. Note: node_modules
  was already present in this environment, so npm install was not
  re-run by this gate.

## End to end integration checks performed

Pages exist and route, from the build output and source inspection:
- Outfit Builder home (/), Wardrobe grid (/wardrobe), Item Detail
  (/items/[id]) plus add (/items/new) and edit (/items/[id]/edit),
  Palette (/palette) and Palette correction (/palette/correct),
  Advice Rules editor (/advice-rules), Saved Outfits (/outfits) and
  outfit detail (/outfits/[id]), Settings (/settings), sign in
  (/sign-in), and auth callback (/auth/callback).

Frozen API only:
- Frontend data calls go through lib/api-client.ts, which calls only
  /api/* paths from docs/api-contract.md. No page or component calls
  Supabase Postgres or Storage directly for data. Supabase use in the
  frontend is auth only: sign in with Google, auth callback session
  exchange, and auth session reads in lib/auth.tsx and
  lib/supabase-client.ts. No invented endpoint was found in
  lib/api-client.ts. The one fetch outside the client is the export
  POST to /api/export, which is a frozen endpoint.
- Protected routes: /, /wardrobe, /items/*, /palette/*, /advice-rules,
  /outfits/*, and /settings all call useRequireAuth, which redirects
  unauthenticated users to /sign-in. API routes return 401, not a
  redirect, verified live: unauthenticated GET /api/items returned 401,
  and a wrong owner GET returned 403.

Live API probe in this gate (local dev server, test token only):
- GET /api/auth/session returned the test user.
- Created a Deep Winter palette, a Navy palette colour, and a warm
  oranges avoid rule.
- Created a Navy sweater by colour; the server rated it Perfect with
  score 100 and reason "This colour is 0 Delta E from your Navy."
- Duplicate outfit item returned 400, as above.
- Logging the outfit as worn incremented the item wearCount from 0
  to 1, with paletteScore 100 and verdict Perfect preserved.

Outfit explanation display:
- app/page.tsx shows palette, fit, contrast, and rotation scores for
  every suggested outfit, plus an explanation list built from engine
  scores and fired rules. A suggestion with no explanation is not
  produced by the engine path, because scoreOutfit always returns an
  explanation array and the gate test asserts it is non-empty.

## Spec section 3 success criteria, verdicts

(a) Palette upload, correction in under 5 minutes, and save: FAIL.
- What works: text extraction, beauty filtering, correction screen
  (rename, role, hex, delete, add, Remove beauty colours with undo,
  summary counts and warnings), and save through the frozen palette
  colour and avoid rule endpoints. Starting hex values for spec
  section 15 colours are prefilled on the correction screen.
- What fails: spec 4.3 step 2 requires rendered page swatch sampling
  and a manual tap picker fallback when detection is unreliable. That
  fallback is not implemented (Agent A blocked item 6, confirmed in
  this gate). The ingester is text based and only recognises known
  colour names, so a real user PDF with different names, shades, or
  layout is not proven to ingest, and no real PDF was run in this gate.
  No timing measurement for "under 5 minutes" was possible without a
  real PDF and a real user correction session. Save also requires a
  hex for every colour, because the API requires hex on palette colour
  create, while spec 4.3 step 3 allows a named rule with no hex.
  Until swatch sampling and the tap picker exist, this criterion is
  not met, not merely unmeasured.

(b) Rating cases: PASS.
- Verified with the real rating library and the live API:
  white collared shirt (#FFFFFF) rates Strong, score 84.2, nearest
  Cool White; navy sweater (#12284B) rates Perfect, score 100, nearest
  Navy; warm orange hoodie (#E86A1F) rates Avoid, score 34.21, reason
  cites the warm oranges avoid range and caps at 40; light pastel tee
  (#E8DDE6) rates Avoid, score 40, reason cites the light pastels
  avoid range; emerald knit (#046A38) rates Perfect. The gate tests
  assert all of these, plus the secondary clash case (navy base with
  a 30 percent warm orange stripe is reduced and flagged).

(c) Outfit builder hard rules: PASS on the build path, with two bugs
reported below that break the rules on other paths.
- Build path passes: no two outers, no two bottoms, no two shoes,
  max one saturated accent, archived or stored excluded, interview
  only Perfect and Strong with no hoodies or graphic tees. These are
  asserted by the new gate tests on real wardrobes.
- Bug 1 (shuffle path) and Bug 2 (diversity fill fallback) are in
  the bugs section. Because shuffle is a spec 6.1 builder action, the
  hard rules are not enforced everywhere the user can change an
  outfit, so this criterion cannot be marked fully pass for the whole
  builder. It is recorded here as pass on generation, fail on shuffle
  and on small wardrobe diversity, and it contributes to the overall
  gate failure.

(d) Every suggested outfit shows palette score, fit match, and
contrast reasoning: PASS on the build path.
- The builder page renders palette, fit, contrast, and rotation scores
  and an explanation list per outfit, and the gate test asserts scores
  and a non-empty explanation for every generated outfit. Note: the
  explanation text includes a generic anchor sentence for every outfit
  ("Dark neutral bottom anchors this outfit."), which is rule derived
  but not specific to the items; it does not hide a missing score.

(e) Android mobile browser and PWA use, no paid service required:
UNPROVEN.
- What exists: PWA manifest (public/manifest.webmanifest), service
  worker (public/sw.js), icons, theme colour, and a PWA install
  component, plus offline wardrobe caching from the last loaded
  wardrobe in app/page.tsx. No paid service is required for the core
  features in the code inspected.
- What was not verified: no real Android device is available in this
  environment, and no live Supabase project exists, so install, offline
  behaviour on a device, and Google sign in against a real Supabase
  project were not verified. These remain Agent D or user verification
  items, as recorded by Agent A.

## Agent A blocked items, status in this gate

1. Gated tests are interface skeletons: PARTLY TIGHTENED.
   This gate adds 8 real case tests (real wardrobes, real rating
   inputs, real ingester page text) in
   tests/impl-gated/gate-ISSUE-31.test.js. All 8 pass non-live and
   live. What is still not tightened: real PDF binary parsing through
   pdf.js, rendered swatch sampling, background removal on a real
   photo, and colour clustering on a real photo. Those need a browser
   and a real file, which this Node test environment does not prove.
2. No dislike endpoint, dislikes are browser local storage only:
   CONFIRMED, still open. lib/dislikes.ts stores closet_dislikes in
   local storage and the engine blocks the exact combination for 30
   days on that device. Dislikes do not sync across devices. A
   contract addition through Agent D would be needed to change this.
   The Settings and builder UI do not claim otherwise.
3. No account delete endpoint, Settings delete honestly reports
   blocked and deletes nothing: CONFIRMED, still open. The Settings
   page confirms, then shows that deletion is blocked because the
   frozen API has no account delete endpoint, and no data is deleted.
   This is honest, but spec 9.4 and section 10 require account and
   data deletion from Settings, so this is a spec gap, not just a
   missing nice to have.
4. No storage usage endpoint, Settings estimates usage and says so:
   CONFIRMED, still open. Settings estimates about 200KB per photo
   against the 1GB free tier and warns at 80 percent, and states on
   the page that this is an estimate because the frozen API has no
   storage usage endpoint.
5. Advice rule avoidTag not in API shape: CONFIRMED, still open. The
   UI stores the single conditionFitTag the contract supports. Full
   fidelity avoid tags live only in backend lib/advice-rules.js.
   Changing this needs a contract change through Agent D.
6. Swatch sampling partial, text based extraction only: CONFIRMED,
   still open, and it fails criterion (a) above. Rendered page swatch
   sampling and the manual tap picker fallback are not implemented.
   Starting hex values are prefilled for correction.
7. Background removal is a local corner colour method, not @imgly:
   CONFIRMED, acceptable deviation. Spec 9.2 names @imgly as an
   example, not a requirement, and the spec required behaviour on
   failure is a manual fallback, which the UI provides. Real photo
   background removal quality was not measured in this gate.
8. Google sign in against a real Supabase project and PWA install on
   a real Android device not verified live: CONFIRMED, still
   unproven. No live Supabase project was created by this gate, and
   no real Android device was used. Do not claim these are verified.

## Bugs found, reported to Agent D, not silently fixed

Bug 1, shuffle slot bypasses hard rules (app/page.tsx, shuffleSlot):
- Expected: a shuffled outfit must still satisfy the same hard rules
  as a generated outfit (no two accents, interview verdict and
  hoodie or graphic tee exclusions, dislike blocking).
- Actual: shuffleSlot picks the highest paletteScore alternative in
  the slot, filtering only by slot, in rotation status, and not the
  current item. It does not re-check accent count, interview verdict
  or category exclusions, disliked combinations, or season.
- Recommendation: route shuffle through the same constraint checks
  as buildOutfits, or filter alternatives by those rules before
  picking. Owner routing is for Agent D.

Bug 2, diversity fill fallback can repeat a top and outer pair
(lib/outfit-engine/index.js, buildOutfits):
- Expected: per spec 6.3 variety, the final 3 outfits must not share
  the same base top and outer combination.
- Actual: if diversity filtering leaves fewer than 3 outfits, the
  code fills from the top 20 in order without checking the seen pair
  set, so a small wardrobe can return 3 outfits sharing a pair.
- Recommendation: fill only with distinct pairs, or return fewer
  than 3 outfits with a message about what is missing. Owner routing
  is for Agent D.

Minor observation, engine interview filter
(lib/outfit-engine/index.js, buildOutfits):
- Expected: interview outfits should contain only rated Perfect or
  Strong items.
- Actual: the filter only rejects an item when paletteVerdict is set,
  so an item with a null verdict passes into an interview build.
- Recommendation: Agent D decides whether unrated items should be
  excluded from interview builds or rated before building. This was
  not observed in the gate tests because every test item was rated.

## Secrets, em dash, and framework checks

- Em dashes: none found in app/, components/, lib/, tests/, scripts/,
  or docs/ files added or inspected for this gate, by a byte scan for
  the em dash character. The new gate files were checked before commit.
- Vue or other UI framework: no Vue import found in app, components,
  lib, or package.json. package.json shows Next.js 15, React 19,
  Tailwind CSS, Supabase JS, and pdfjs-dist. shadcn style components
  live in components/ui.tsx, not a separate UI framework.
- Direct Supabase data access: none found outside auth, as described
  above. Backend lib/storage code is the pre-existing storage provider,
  not frontend data access.
- Secrets: .env.example contains placeholders only. .env.local was
  not created by this gate and is not tracked. No real credential,
  API key, or password was added. The live probes used test tokens
  (Bearer test:<user-id>) in local mode only.
- Forbidden paths: this gate changed no file under lib/, app/,
  components/, supabase/, or scripts/dev-server.js, and did not change
  docs/api-contract.md or docs/openapi.yaml. Verified with git status
  before commit: only the new gate test, this report, and the PR file.

## Per issue verdicts (merged issues, summary)

- ISSUE-01 to ISSUE-15, ISSUE-21, ISSUE-23 to ISSUE-26, ISSUE-28 to
  ISSUE-30: pass on the evidence of the live suite (143 pass) and the
  live probe, subject to the unproven live Supabase note that applies
  to all backend issues.
- ISSUE-03 and ISSUE-04 (palette ingester and correction): partial,
  criterion (a) fails on swatch sampling and tap picker.
- ISSUE-09 (background removal): partial by method, acceptable per
  spec wording, real photo quality unproven.
- ISSUE-16 and ISSUE-17 (outfit engine and builder): partial, build
  path passes, shuffle path fails Bug 1, diversity fails Bug 2 on
  small wardrobes.
- ISSUE-18 (advice rules UI): pass within the frozen contract, with
  the avoidTag contract gap noted.
- ISSUE-19 (saved outfits): pass on live suite and code inspection.
- ISSUE-20 (Google Auth): partial, code and local test mode pass,
  real Supabase Google sign in unproven.
- ISSUE-22 (settings): partial, profile edit, export link, and honest
  blocked delete pass as implemented, but account delete itself is
  missing and storage usage is estimated.
- ISSUE-27 (PWA and offline): partial, manifest and offline cache
  code exist, real Android device verification unproven.

## Gate verdict

GATE FAILS. The merged app passes its full test suite live (143 of
143) and the rating and outfit generation paths are genuinely strong,
but the MVP cannot be called done while spec criterion (a) fails on
swatch sampling, criterion (c) fails on the shuffle path, account
deletion is blocked, and Android PWA use plus real Supabase sign in
remain unproven. Those items go back to Agent D for routing: swatch
sampling and tap picker to Agent A, shuffle and diversity fixes to
Agent A, account delete and storage usage endpoints to Agent B through
a contract change, and device plus live project verification to
Agent D or the user. Do not merge this gate as an MVP done claim.
Merging the gate report itself is for Agent D to decide, with this
failure recorded, not hidden.

## What was not verified here, and why

- No live Supabase project exists and none was created. All live
  results are against the local dev server in test mode.
- No real Android device was available. PWA install and offline use
  on a device are unproven.
- No real palette PDF binary was parsed. Ingester tests use page text.
- No real item photo was background removed or colour clustered.
  Photo pipeline quality is unproven.
- Performance on a mid range Android phone (spec 11.4, 200 items in
  under 3 seconds) was not measured. No device and no 200 item
  wardrobe were available in this gate.
- Correction in under 5 minutes was not timed, for the reasons under
  criterion (a).
