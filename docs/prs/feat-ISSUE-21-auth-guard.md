# PR: feat/ISSUE-21-auth-guard

- Issue closed: ISSUE-21 (API auth guard and session endpoint)
- Branch: feat/ISSUE-21-auth-guard
- Based on: feat/ISSUE-26-validation-errors. Merge order position: 5 of 16, after ISSUE-26 and before ISSUE-01. Note on order: the task lists ISSUE-21 among the resource APIs, but auth is a prerequisite for every resource API, so this branch is merged before the resource branches. The dependency chain is ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, then this branch, then ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05. Agent D must merge in that order.
- Dependency chain: this branch is the base for feat/ISSUE-01-palette-crud.

## What changed

- Added `lib/api/auth.js`: auth guard that runs before routing. Missing or malformed tokens are 401. Local and test mode accepts `Bearer test:<user-id>` only when `CLOSET_TEST_MODE=1` or when Supabase variables are absent. With Supabase configured, the token is validated against the Supabase Auth user endpoint (signature checked by Supabase), not by trusting a decoded payload. No service role key is used in the guard, and no service role key may appear in client code.
- Added `lib/api/store.js`: in memory store (Maps per collection) for local development and tests.
- Added `lib/data/repository.js`: repository interface (`list`, `get`, `insert`, `update`, `delete` per collection) with a memory implementation (default, no credentials) and a Supabase PostgREST implementation (selected when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, unless `CLOSET_FORCE_MEMORY_STORAGE=1`). Handlers use only this interface, never Supabase directly. API camelCase is translated to snake_case columns and back.
- Added `lib/api/router.js`: transport agnostic router (handlers return `{ status, body }`, or zip or file results). Includes `GET /api/auth/session` and `GET`/`PATCH /api/profile` (profile auto created on first call; `activePaletteId` is 400 when the palette does not exist and 403 when it belongs to another user). Ownership rule is enforced in the router helpers: existence first, then ownership, so wrong owner is 403 and missing is 404. Auth runs before routing, so an unauthenticated request to an unknown path is 401, which is what the Agent C live API test expects.
- Added `scripts/dev-server.js`: dependency free Node server on PORT (default 3101) serving the same router. Run with `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js` and authenticate with `Authorization: Bearer test:<user-id>`. No real credentials are needed.
- Added the minimal Next.js scaffold needed for API routes to run: `package.json`, `tsconfig.json`, `next.config.mjs`, and `app/api/[...path]/route.ts`, a catch-all adapter to the same router. No wardrobe, builder, palette, or settings UI pages were built. Agent A owns those.
- Contract change: No contract change. This branch implements the auth, session, and profile sections of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- Unauthenticated: `curl http://localhost:3101/api/auth/session` must return 401 with the single error shape.
- Authenticated: `curl -H "Authorization: Bearer test:user-1" http://localhost:3101/api/auth/session` must return 200 with the user id.
- Profile: `curl -H "Authorization: Bearer test:user-1" http://localhost:3101/api/profile` must return 200 with an auto created profile.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 79, fail 0, skipped 19. Matches the main baseline. No impl-gated test was expected to turn green yet, because the live API tests are skipped without `CLOSET_TEST_BASE_URL`, and the rating and advice gated tests need their libraries (ISSUE-10 and ISSUE-15).
- Manual dev server checks during development: unauthenticated session returned 401, authenticated session returned 200, and profile GET auto created a profile. Those checks were ad hoc curl checks, not committed tests. Committed live API tests land with the resource branches and cover session, auth, and error cases through the dev server.

## Mismatch or blocked items

- Mismatch note for Agent D: Agent C impl-gated API tests use placeholder paths (`/placeholder-path-to-be-confirmed`) and are skipped without a base URL. They do not yet assert the frozen paths from the ISSUE-23 contract. Routing note: after this backend work is merged, route those skeleton tests to Agent C to update them to the frozen paths. Backend branches do not edit Agent C tests.
- Blocked: the Supabase repository and the Supabase Auth validation path have not been exercised against a live Supabase project, because no live project exists in this task. Local mode is fully testable. Confirm against a real project before production use.
- Blocked: `next build` and `next dev` have not been run here, because Next.js dependencies are not installed in this environment and installing them was not required for the API work. The Next.js route file is a thin adapter to the tested router, but Agent A or Agent D should run `npm install` and `npm run build` when the frontend scaffold is reviewed.
- No secrets added. No em dashes added (checked by grep before commit).
