# PR: feat/ISSUE-05-palette-versioning

- Issue closed: ISSUE-05 (Palette versioning and re-rate all items)
- Branch: feat/ISSUE-05-palette-versioning
- Based on: feat/ISSUE-28-data-export. Merge order position: 16 of 16, last. Agent D must merge in the order listed in the final backend report, starting with ISSUE-23 and ending with this branch.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, then this branch.

## What changed

- Added `lib/api/rerate.js`: POST `/api/palettes/:id/rerate` re-rates every non deleted item of the user against that palette, using the ISSUE-10 rating engine with that palette's colours and avoid rules. For each item with a primary colour, it updates autoScore, paletteScore, paletteVerdict, nearest palette colour, and ratingReason. An item with a manual score keeps its manual score as its effective paletteScore, while its auto score is still updated. Items with no primary colour, or with no usable nearest palette colour, are skipped. Response: `{ paletteId, reratedCount, skippedCount, totalCount }`.
- Palette versioning itself (POST `/api/palettes/:id/versions`, version number increased by 1, colours and avoid rules copied, original kept, items never deleted) landed on the ISSUE-01 branch, because versions are part of palette CRUD. This branch completes ISSUE-05 by adding the re-rate endpoint that versions depend on. Activate (POST `/api/palettes/:id/activate`) also landed on ISSUE-01.
- Added `tests/api-local/api.test.js`: committed live API tests that spawn the dev server on localhost and exercise session, auth errors, palette and colour and avoid rule CRUD, wrong owner and missing resource, item auto rating, rating concrete cases, WebP upload and signed URL serving, outfit duplicate slot, wear log counts, advice seed idempotence, palette version and rerate, and export ZIP magic bytes. These tests use test tokens and no real credentials.
- Registered the rerate route in `lib/api/router.js`.
- Contract change: No contract change. This branch implements the palette version and rerate sections of the ISSUE-23 contract. The rerate endpoint is synchronous in MVP, as documented in the contract; background progress is a frontend indicator, not a separate API job in MVP.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create a palette with navy, create a navy item, create a palette version and check version 2 and the original kept, then POST rerate on the original palette and check reratedCount, skippedCount, and totalCount.
- Run: `sh scripts/check-tests.sh` from the repo root. This now includes the new api-local tests.

## Test results

- Agent C suite plus api-local tests on this branch: see the run below (recorded at commit time). Expected: total rises from 98 to 111 (13 new api-local tests), pass rises accordingly, fail 0, skipped stays at 13 (outfit engine 5, palette ingester 3, live API 5, which need Agent A or a base URL respectively).
- No Agent C test was edited. The api-local tests are new files, not edits to Agent C files.

## Mismatch or blocked items

- None for this branch beyond the standing items in the final backend report: outfit engine and palette ingester gated tests belong to Agent A, and live API gated tests need CLOSET_TEST_BASE_URL set to a running server.
- No secrets added. No em dashes added (checked by grep before commit).
