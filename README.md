# Closet App MVP

A free, personal wardrobe app for one user, built as a web app that can be installed on Android as a PWA.

What it does, in order:
1. Learn the user's colour palette from a palette PDF, and let the user correct it.
2. Rate every clothing item against that palette.
3. Build outfits from pieces that fit, using fit and proportion rules that are specific to the user and editable by the user.

The outfit builder is the home screen and the main feature. The palette ingester and the item rating exist to make the outfit builder trustworthy.

## Source of truth

The build spec at `../your_files/closet-app-mvp-build-spec.md` in the parent workspace is authoritative for MVP scope. Do not invent features outside it. Key settled choices:
- Frontend: Next.js, TypeScript, Tailwind, PWA.
- Backend data: Supabase for user, item, and outfit data.
- Images: Supabase Storage first, not a separate S3 bucket, behind a StorageProvider abstraction for a possible later move to Cloudflare R2 or home server MinIO.
- Outfit choosing: browser rule engine using pruned beam search in a Web Worker, using precomputed item data from the API.
- Home server LLM: only as an optional Phase 2 advisor via Ollama 3B over Tailscale, never the outfit decider.
- Physical location: out of MVP, except for a nullable field in the data model.
- No paid API is required for core features. No Play Store publishing in MVP.

## Stack

- Next.js, TypeScript, Tailwind CSS, PWA
- Supabase Auth (Google Auth), Supabase Postgres, Supabase Storage
- Browser: pdf.js for palette PDFs, background removal and colour clustering in a worker, Delta E rating in CIELAB
- Tests: spec based unit and integration tests under `tests/`, see `tests/TEST-PLAN.md` once Agent C creates it

## How to run (once the app scaffold lands)

1. Copy `.env.example` to `.env.local` and fill in your own Supabase project values. Never commit real values.
2. Install dependencies and run the dev server, following the commands in the app README once Agent A and Agent B land the scaffold.
3. Run tests with the command documented in `tests/TEST-PLAN.md`.

Until the scaffold lands, this repo contains planning docs only. That is intentional: issues and contracts come before feature code.

## Environment variables (placeholders only)

See `.env.example`. Real values come from the user's own Supabase project and Google OAuth client, set up in Supabase. Do not invent credentials, and do not commit them.

## Workflow

See `WORKFLOW.md` and `CONTRIBUTING.md`. In short: never push to main, work on a feature branch per issue, reference the issue in every commit, include a PR description file under `docs/prs/`, and only Agent D merges to main after Agent C tests pass and Agent D reviews.

## Status

Phase 0: repo, epics, stories, and issues created on main. No feature code merged yet. See `docs/issues/INDEX.md` and `docs/merges.md`.
