# Closet App

A free, personal wardrobe app that rates clothes against your colour palette and builds outfits from the pieces that actually fit, with a reason for every suggestion.

It is built for one real problem: most wardrobe apps will suggest a nice looking outfit that clashes with your palette, ignores your build, or repeats the same combination. This one treats palette, fit, and proportion as hard constraints first, and style as a layer on top of them.

## What it does

1. **Learn your palette.** Upload a palette PDF, and the app extracts its colours and roles, then lets you correct them before anything is saved. Beauty sections in a palette PDF, such as makeup and hair colours, are excluded from clothing ratings.
2. **Rate every item.** Each item is photographed, background removed, and colour clustered, then scored in CIELAB colour space against your palette. The result is a plain language verdict: Perfect, Strong, Works as a neutral or accent only, or Avoid, plus the nearest palette colour and the reason.
3. **Build outfits.** The outfit builder is the home screen. Pick an occasion, season, and vibe, and it generates three outfits, each with palette scores, fit notes, and a short explanation of why it works. You can save an outfit, log it as worn, shuffle one slot, or dislike a combination.

Interview outfits follow stricter rules: only Perfect and Strong items, no hoodies or graphic tees, with a white or light neutral collared shirt preferred when one exists. Unrated items are allowed in interview builds only as a fallback, and they are clearly flagged as not palette verified.

## Why this project is interesting

- **A rule engine, not a chatbot.** Outfit generation runs in the browser as a pruned beam search in a Web Worker, not as a call to a paid language model. It filters by rotation status, season, palette verdict, and occasion rules, anchors on neutral bottoms, scores palette, fit, contrast, and rotation, and enforces diversity so the three outfits are real choices, not the same top and outer with different shoes. A naive brute force over a 300 item wardrobe would be billions of combinations. This is not that.
- **Colour is computed, not guessed.** Rating uses CIELAB Delta E, with neutral saturation handling and avoid rules for ranges such as warm oranges, light pastels, and muted earthy hues. A warm orange cannot score well just because it is numerically near a true red swatch.
- **Fit rules are data, not hard coded assumptions.** Advice rules for shoulders, sleeve fit, outer body, trouser cut, contrast, and one romantic detail per outfit are stored as editable records. Change a rule and the builder changes with it. The starting rules come from a stated user profile, and every rule shows its reason in plain language.
- **Free tier by design.** No paid API is required for core features. Photos are compressed to WebP before upload, Supabase Storage is used first behind a storage abstraction, and a home server language model is an optional Phase 2 advisor only. It can never override a palette avoid, a fit rule, or a category rule, and the app works unchanged if that server is off.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn style components, PWA installable on Android
- **Backend and data:** Supabase Auth (Google sign in), Supabase Postgres with Row Level Security on `user_id` for every table, Supabase Storage in a private bucket with short lived signed URLs
- **Image and colour processing:** pdf.js for palette PDFs, in browser background removal and colour clustering, CIELAB Delta E rating
- **Outfit engine:** Pure TypeScript in `lib/outfit-engine/`, runnable in a Web Worker and testable in Node, with no business logic locked inside API routes
- **API:** Next.js API routes under `app/api/`, with a frozen contract in `docs/api-contract.md` and an OpenAPI description in `docs/openapi.yaml`
- **Testing:** Spec based unit and integration tests under `tests/`, written from the spec before the code they cover

## Architecture at a glance

```
Phone / PWA (Next.js)
  Rule engine in a Web Worker, image processing before upload
    |
Next.js on Vercel (UI, API routes, auth session)
    |
Supabase: Auth, Postgres, Storage (private bucket)
    |
Optional, Phase 2 only, via Tailscale
Home server: Ollama, advisor only, never the decider
```

Key decisions, and why:

- **Supabase Storage first, not a separate S3 bucket.** A separate bucket would add a second set of credentials, CORS rules, signed URL logic, and a second bill, with no benefit at this scale. The database stores only a storage path, never a public URL.
- **Storage abstraction from day one.** A `StorageProvider` interface with `upload` and `getSignedUrl` means a later move to Cloudflare R2 or home server MinIO is a configuration change, not a rewrite.
- **Precompute at upload, read at build time.** Palette score, dominant colours, colour family, and fit tags are calculated when an item is added. The builder only reads stored numbers, which is what makes it fast and offline capable.
- **Privacy by default.** Colour extraction, background removal, and outfit building run on device or in the user's own Supabase project, not on a shared AI service. There is no social feed, no public wardrobe, and no retailer or order history import.

## Project structure

- `app/` - Next.js App Router screens: outfit builder home, wardrobe, item detail, palette correction, advice rules, saved outfits, settings, auth
- `lib/outfit-engine/` - The outfit builder engine, including the beam search, hard rule checks, shuffle, and diversity handling
- `lib/` - Rating, colour clustering, palette ingestion, and storage provider code
- `supabase/migrations/` - Postgres schema with Row Level Security
- `docs/` - The full build spec, API contract, contract freeze record, epics, stories, issues, and merge history
- `tests/` - Spec based tests, test plan, and the integration gate report

The full design, including the rating formula, occasion rules, fit rules, data model, milestones, and acceptance tests, is in `docs/closet-app-mvp-build-spec.md`. Start there if you want the reasoning, not just the code.

## Status, honestly

This is a working build with tests passing, not a finished product claim.

- Latest verified test run, October 30, 2026: 172 tests total, 152 pass and 20 skipped without a live server, 166 pass and 6 skipped live, 0 failures in both runs. `npm run build` exits 0.
- The three bugs found by the first integration gate are fixed: shuffle now rechecks hard rules, diversity fill never repeats a top and outer pair, and interview builds handle unrated items with warnings as decided above.
- Two gate criteria are still open, and they are recorded as open rather than papered over. See `tests/INTEGRATION-GATE.md` and `docs/issues/`.
  - Palette upload and correction: rendered swatch sampling and the manual tap picker fallback from spec section 4.3 step 2 are not yet implemented. The ingester is currently text based, with prefilled starting colours for correction.
  - Android mobile browser and PWA: unproven without a real Android device and a live Supabase project. No live Supabase Google sign in, real palette PDF run, real item photo pipeline, or 200 item performance run has been verified yet.
- Known limitations, also recorded in the gate report: dislikes are stored in browser local storage only, with no cross device endpoint in the frozen contract; account delete is honestly blocked in Settings, because there is no endpoint for it; storage usage in Settings is an estimate, not a live endpoint.

## Run it locally

1. Copy `.env.example` to `.env.local` and fill in your own Supabase project values. Never commit real values.
2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

3. Run the build:

```bash
npm run build
```

4. Run the tests:

```bash
npm test
```

The API can also be run on its own with `npm run dev:api`. See `tests/TEST-PLAN.md` for what the test suite covers.

## What I would do next

- Finish rendered swatch sampling and the manual tap picker for the palette ingester, then run a real palette PDF through it and time the correction flow.
- Stand up a real Supabase project, run the migrations, set up Google OAuth, deploy to Vercel, and verify sign in, PWA install, and offline viewing on a real Android device.
- Add the missing endpoints as product decisions, not silent code changes: cross device dislikes, account delete, live storage usage, and the advice rule `avoidTag` field.
- Run the 200 item performance test from spec section 11.4, then add the Japan travel packing list from Milestone 4.

## For contributors and reviewers

- Workflow, branch rules, and merge rules are in `WORKFLOW.md` and `CONTRIBUTING.md`.
- Epics, stories, and issues live under `docs/issues/`, with merge history in `docs/merges.md`.
- The API contract is frozen in `docs/contract-freeze.md`. Contract changes go through a test update, not a quiet edit.
