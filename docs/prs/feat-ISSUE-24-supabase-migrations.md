# PR: feat/ISSUE-24-supabase-migrations

- Issue closed: ISSUE-24 (Supabase Postgres schema migrations and RLS policies)
- Branch: feat/ISSUE-24-supabase-migrations
- Based on: feat/ISSUE-23-api-contract. Merge order position: 2 of 16, after ISSUE-23 and before ISSUE-25. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23 contract, then this branch, then ISSUE-25 storage, ISSUE-26 validation, ISSUE-21 auth, then resource APIs.

## What changed

- Added `supabase/migrations/` with 10 migrations in documented order, covering profiles, palettes, palette_colors, avoid_rules, items, item_colors, advice_rules, outfits, outfit_items, and wear_logs, plus a private storage bucket migration and updated_at triggers.
- Added `supabase/migrations/README.md` documenting the exact migration order, the RLS rule, and how to apply with the Supabase CLI.
- Every table has RLS enabled with select, insert, update, and delete policies on `user_id` (join tables also check parent ownership).
- API field mapping: API camelCase maps to snake_case columns (for example `paletteId` to `palette_id`).
- Contract change: No contract change. The migrations implement the contract from ISSUE-23.

## How to test

- Review each migration file for RLS and for the tables listed in spec section 16.3.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 79, fail 0, skipped 19. Matches the main baseline. Migrations alone do not turn impl-gated tests green, and no test was changed.

## Mismatch or blocked items

- Blocked: migrations have not been applied to a live Supabase project, because no live project or credentials exist in this task and none may be created here. Agent D or the user must run `supabase db push` against their own project and confirm the apply. The SQL is written to be idempotent where practical, but a live apply confirmation is still outstanding.
- No secrets added. No em dashes added (checked by grep before commit).
