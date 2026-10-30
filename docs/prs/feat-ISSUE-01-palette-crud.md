# PR: feat/ISSUE-01-palette-crud

- Issue closed: ISSUE-01 (Palette and palette colour CRUD API)
- Branch: feat/ISSUE-01-palette-crud
- Based on: feat/ISSUE-21-auth-guard. Merge order position: 6 of 16, after ISSUE-21 and before ISSUE-02. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, then this branch, then ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/colour.js`: pure colour helpers (hex to RGB, RGB to HSL, RGB to Lab, Delta E 76, family from hue) used to derive Lab and HSL values from a hex when the client supplies only a hex. The rating engine (ISSUE-10) reuses these helpers.
- Added `lib/api/ownership.js`: ownership helper in its own module to avoid a circular require between the router and resource handlers. Existence first, then ownership: wrong owner is 403, missing is 404.
- Added `lib/api/palettes.js`: palette CRUD (create, list with isActive filter and name or recent sort, get with colours and avoid rules embedded, update, delete with colours and avoid rules, activate, versions) and palette colour CRUD (create, list with role filter, get, update, delete). Creating a palette with isActive true deactivates the user's other palettes. Deleting a palette never deletes items. Colour create derives Lab, hue, saturation, and lightness from hex when those fields are omitted, and colour update re-derives them when hex changes without those fields.
- Fixed an auth guard ordering bug found while testing this branch: an unauthenticated request to a non /api path previously returned 404 instead of 401, because the path check ran before auth. Auth now runs before any routing or path check (except the local signed file route, which is token based). This fix belongs to ISSUE-21 behaviour and is recorded here so Agent D sees it; the ISSUE-21 PR file does not need to change, because the behaviour now matches what that PR described.
- Registered the palette and palette colour routes in `lib/api/router.js`. The palette rerate endpoint is not in this branch; it belongs to ISSUE-05 and lands on that branch.
- Contract change: No contract change. This branch implements the palette and palette colour sections of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create a palette, add a colour with only a hex and check that Lab and HSL fields are filled, list palettes, activate a second palette and check the first is deactivated, create a version and check the version number increased and the original is kept, then delete the version.
- Check errors: no token is 401, another user's palette id is 403, a missing palette id is 404, a bad hex or family is 400 with the single error shape.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 79, fail 0, skipped 19. Matches the main baseline. No impl-gated test covers palettes directly, so no gated test was expected to turn green here.
- Manual dev server checks during development: palette create, colour create with derived Lab and HSL, activate deactivation, version copy, and the 401, 403, 404, and 400 cases were all verified with curl. Those checks were ad hoc, not committed tests. Committed live API tests covering palettes land with the later resource test additions and are reported in the final backend report.

## Mismatch or blocked items

- None for this branch. Agent C tests do not import palette handlers, so there is no interface mismatch.
- No secrets added. No em dashes added (checked by grep before commit).
