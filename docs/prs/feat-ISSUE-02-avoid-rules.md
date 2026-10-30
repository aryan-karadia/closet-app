# PR: feat/ISSUE-02-avoid-rules

- Issue closed: ISSUE-02 (Avoid rules CRUD and validation)
- Branch: feat/ISSUE-02-avoid-rules
- Based on: feat/ISSUE-01-palette-crud. Merge order position: 7 of 16, after ISSUE-01 and before ISSUE-10. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, then this branch, then ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/api/avoid-rules.js`: avoid rule CRUD under a palette (create, list, get, update, delete), with validation of all ranges (hue 0 to 360, saturation and lightness 0 to 100, min less than or equal to max, checked on create and on merged PATCH values), ownership through the parent palette (wrong owner palette is 403, missing palette or rule is 404, rule not in the palette is 404).
- Added `DEFAULT_AVOID_RULES` (warm oranges, light pastels, muted earthy hues, with the spec section 4.4 ranges) and `matchesAvoidRule(hsl, rule)`, used by the rating engine in ISSUE-10. The rating engine uses a palette's own avoid rules when present, and these defaults when a palette has none.
- Fixed a bug found while testing versions on the previous branch: palette colours were created without `userId`, so palette colour lists (filtered by user) and version copies lost them. Palette colours now carry `userId`. This fix is recorded here; it does not change the contract.
- Registered the avoid rule routes in `lib/api/router.js`.
- Contract change: No contract change. This branch implements the avoid rule section of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create a palette, add the warm oranges rule (hue 20 to 50, saturation 41 to 100, lightness 30 to 70), list avoid rules, update the description, then delete the rule.
- Check errors: a rule with hueMin greater than hueMax is 400, a rule under another user's palette is 403, a missing palette is 404.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 79, fail 0, skipped 19. Matches the main baseline. No impl-gated test covers avoid rules directly, so no gated test was expected to turn green here.
- Manual dev server checks during development: avoid rule create, list, update, delete, the min greater than max 400, and the version copy colour fix (a version now copies colours) were verified with curl. Those checks were ad hoc, not committed tests.

## Mismatch or blocked items

- None for this branch. Agent C tests do not import avoid rule handlers, so there is no interface mismatch.
- No secrets added. No em dashes added (checked by grep before commit).
