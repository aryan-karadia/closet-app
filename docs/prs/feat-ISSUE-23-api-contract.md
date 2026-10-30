# PR: feat/ISSUE-23-api-contract

- Issue closed: ISSUE-23 (API contract draft)
- Branch: feat/ISSUE-23-api-contract
- Base for next backend branch: this branch. Merge order position: 1 of 16. Agent D must merge branches in the order listed in the final backend report, starting with this one.
- Dependency chain: this branch is the base for feat/ISSUE-24-supabase-migrations, which is the base for feat/ISSUE-25-storage-provider, and so on. Do not merge a later backend branch before this one.

## What changed

- Rewrote `docs/api-contract.md` from a placeholder into a full DRAFT contract: method, path, request schema, response schema, auth, validation, and error cases for every MVP endpoint (auth session, profile, palettes, palette colours, avoid rules, items, item colours, uploads and signed URLs, outfits, outfit items, wear logs, advice rules, data export).
- Added `docs/openapi.yaml` as the machine readable form of the same contract. Where they disagree, `docs/api-contract.md` wins and the OpenAPI file must be corrected through Agent D.
- Contract status is DRAFT, not frozen. This PR does not claim a freeze. Agent D freezes it.
- Contract change: this PR creates the contract. No earlier contract existed to break, so there is no breaking change to an existing frozen contract. Statement for later branches: later backend branches implement this contract and must report "No contract change" unless they change a path, schema, or error case, in which case they must say so here.

## Decisions recorded in the contract

- JSON camelCase, database snake_case, API translates.
- One error shape for all endpoints: `{ error: { code, message, details? } }` with 400, 401, 403, 404, 405, 500 codes.
- Wrong owner is 403, missing resource is 404, checked in that order.
- Auth callback is a Supabase Auth redirect flow, not a bearer authenticated data endpoint. There is no unauthenticated data route.
- Wrapped hue ranges are not supported in MVP avoid rules.
- Item category is a free string in MVP, not a closed enum.
- Cost per wear is derived, never stored.
- Palette re-rate is synchronous in MVP.
- Wear log delete decrements counts but does not recompute `lastWornAt`.
- Local signed URL route is local dev only; production signed URLs come from Supabase Storage.

## How to test

- Read `docs/api-contract.md` and `docs/openapi.yaml` and check that every endpoint in the contract table appears in the OpenAPI paths, with matching schemas.
- Run the Agent C suite: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 79, fail 0, skipped 19. This matches the main baseline exactly. No test was changed, and no impl-gated test was expected to turn green from a docs only branch.
- No API tests were added on this branch, because no server code exists yet. API tests land with the backend implementation branches.

## Mismatch or blocked items

- None for this branch. Agent C contract skeleton tests still use placeholder paths, because the contract was not frozen yet at the time Agent C wrote them. Routing note for Agent D: after this contract is frozen, route the skeleton tests to Agent C to update them to the frozen paths. Do not silently edit those tests on a backend branch.
- No secrets added. No em dashes added (checked by grep before commit).
