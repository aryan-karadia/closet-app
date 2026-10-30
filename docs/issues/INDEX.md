# Issues index

Status key: open, in progress, in review, merged, blocked.

## Epics

- E1: EPIC-01: Palette ingester - `docs/issues/EPIC-01-palette-ingester.md` - Owner: Agent B and Agent A - Status: open
- E2: EPIC-02: Item capture and rating - `docs/issues/EPIC-02-item-capture-rating.md` - Owner: Agent B and Agent A - Status: open
- E3: EPIC-03: Outfit builder (home screen) - `docs/issues/EPIC-03-outfit-builder.md` - Owner: Agent A and Agent B - Status: open
- E4: EPIC-04: Auth with Google Auth - `docs/issues/EPIC-04-auth.md` - Owner: Agent A and Agent B - Status: open
- E5: EPIC-05: Backend API and Supabase Storage - `docs/issues/EPIC-05-backend-storage.md` - Owner: Agent B - Status: open
- E6: EPIC-06: QA test suite and CI checks - `docs/issues/EPIC-06-qa-ci.md` - Owner: Agent C - Status: open

## Issues by epic

### E1

- ISSUE-01: Palette and palette colour CRUD API - Owner: B - Status: merged - File: `docs/issues/ISSUE-01.md`
- ISSUE-02: Avoid rules CRUD and validation - Owner: B - Status: merged - File: `docs/issues/ISSUE-02.md`
- ISSUE-03: PDF text extraction and beauty section filter, browser - Owner: A - Status: merged - File: `docs/issues/ISSUE-03.md`
- ISSUE-04: Palette correction screen - Owner: A - Status: merged - File: `docs/issues/ISSUE-04.md`
- ISSUE-05: Palette versioning and re-rate all items - Owner: B - Status: merged - File: `docs/issues/ISSUE-05.md`

### E2

- ISSUE-06: Item CRUD API - Owner: B - Status: merged - File: `docs/issues/ISSUE-06.md`
- ISSUE-07: Item colour storage API - Owner: B - Status: merged - File: `docs/issues/ISSUE-07.md`
- ISSUE-08: Image upload signed URLs via StorageProvider - Owner: B - Status: merged - File: `docs/issues/ISSUE-08.md`
- ISSUE-09: Browser background removal confirm flow and colour clustering - Owner: A - Status: merged - File: `docs/issues/ISSUE-09.md`
- ISSUE-10: Delta E rating engine, shared pure TypeScript lib - Owner: B - Status: merged - File: `docs/issues/ISSUE-10.md`
- ISSUE-11: Item add, edit, and detail UI with score badge - Owner: A - Status: merged - File: `docs/issues/ISSUE-11.md`
- ISSUE-12: Wardrobe grid filters, sort, and search - Owner: A - Status: merged - File: `docs/issues/ISSUE-12.md`

### E3

- ISSUE-13: Outfit and outfit item CRUD API - Owner: B - Status: merged - File: `docs/issues/ISSUE-13.md`
- ISSUE-14: Wear log CRUD and wear count - Owner: B - Status: merged - File: `docs/issues/ISSUE-14.md`
- ISSUE-15: Advice rules CRUD API - Owner: B - Status: merged - File: `docs/issues/ISSUE-15.md`
- ISSUE-16: Browser rule engine, pruned beam search in Web Worker - Owner: A - Status: merged - File: `docs/issues/ISSUE-16.md`
- ISSUE-17: Outfit Builder home screen - Owner: A - Status: merged - File: `docs/issues/ISSUE-17.md`
- ISSUE-18: Advice Rules editor UI - Owner: A - Status: merged - File: `docs/issues/ISSUE-18.md`
- ISSUE-19: Saved Outfits screen - Owner: A - Status: merged - File: `docs/issues/ISSUE-19.md`

### E4

- ISSUE-20: Google Auth via Supabase Auth, session, protected routes - Owner: A - Status: merged - File: `docs/issues/ISSUE-20.md`
- ISSUE-21: API auth guard and session endpoint - Owner: B - Status: merged - File: `docs/issues/ISSUE-21.md`
- ISSUE-22: Settings and profile edit - Owner: A - Status: merged - File: `docs/issues/ISSUE-22.md`

### E5

- ISSUE-23: OpenAPI contract and docs/api-contract.md frozen v1 - Owner: B - Status: merged - File: `docs/issues/ISSUE-23.md`
- ISSUE-24: Supabase schema migrations and RLS policies - Owner: B - Status: merged - File: `docs/issues/ISSUE-24.md`
- ISSUE-25: StorageProvider abstraction, private bucket, signed URLs - Owner: B - Status: merged - File: `docs/issues/ISSUE-25.md`
- ISSUE-26: Validation and error handling standard - Owner: B - Status: merged - File: `docs/issues/ISSUE-26.md`
- ISSUE-27: PWA manifest, install, and offline wardrobe view - Owner: A - Status: merged - File: `docs/issues/ISSUE-27.md`
- ISSUE-28: Data export ZIP - Owner: B - Status: merged - File: `docs/issues/ISSUE-28.md`

### E6

- ISSUE-29: Spec based unit and integration test suite - Owner: C - Status: merged - File: `docs/issues/ISSUE-29.md`
- ISSUE-30: Contract test skeletons and CI check script - Owner: C - Status: merged - File: `docs/issues/ISSUE-30.md`
- ISSUE-31: Integration gate, A plus B plus C end to end - Owner: C - Status: open - File: `docs/issues/ISSUE-31.md`

## Sequencing

1. Agent D: Phase 0 repo and issues, on main only.
2. Agent C: ISSUE-29 and ISSUE-30, spec based tests first, before feature code.
3. Agent B: ISSUE-23 contract, then ISSUE-24, ISSUE-25, ISSUE-26, then resource APIs per epic.
4. Agent A: frontend per issue, only after the contract for that issue is frozen.
5. Agent D: integration, mismatch routing, and merge branch by branch to main, only after Agent C tests pass.

## Follow-up issues from ISSUE-31 gate, 2026-10-30

- ISSUE-32: Shuffle slot must re-check all hard rules - Owner: A - Status: open - File: `docs/issues/ISSUE-32.md`
- ISSUE-33: Diversity fill must not repeat top and outer pairs - Owner: A - Status: open - File: `docs/issues/ISSUE-33.md`
- ISSUE-34: Decide whether unrated items are excluded from interview builds - Owner: D - Status: open - File: `docs/issues/ISSUE-34.md`
