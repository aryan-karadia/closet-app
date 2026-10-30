# PR: feat/ISSUE-10-rating-engine

- Issue closed: ISSUE-10 (Delta E rating engine, shared pure TypeScript lib)
- Branch: feat/ISSUE-10-rating-engine
- Based on: feat/ISSUE-02-avoid-rules. Merge order position: 8 of 16, after ISSUE-02 and before ISSUE-06. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, then this branch, then ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, ISSUE-28, ISSUE-05.

## What changed

- Added `lib/rating.js`: pure Delta E rating library, no dependencies, no I/O, no test imports. It implements spec section 5.3 exactly: score equals 100 minus (Delta E times 2), clamped 0 to 100; tiers Perfect 90 to 100, Strong 70 to 89, Works 50 to 69, Avoid 0 to 49; avoid cap at 40 with verdict Avoid; secondary clash over 25 percent minus 15 points and flagged; neutral saturation cap (neutrals are not penalised for low saturation); core saturation penalty (much less saturated, 25 points or more below the swatch, minus 10 points). It also applies the spec section 5.4 warm undertone note for white, black, and gray neutrals. Exports: `rateItem`, `rate` (alias), `rateColour`, `scoreFromDeltaE`, `tierForScore`, `clampScore`, `normalizeColour`, `normalizePalette`, `findNearest`, `deltaE76`, `hexToLab`, `hexToHsl`, `DEFAULT_PALETTE_COLOURS`, `DEFAULT_AVOID_RULES`.
- Added `lib/rating.d.ts`: TypeScript declarations for the JavaScript library, so Agent A and TypeScript consumers get types.
- The library accepts a primary colour as a hex string, a colour object (hex, Lab, or HSL), a fixture string, or an item shaped object with primary and secondary colours, and a palette as a colour array or an object with colours and avoid rules. When a palette has no avoid rules of its own, the spec starting avoid rules are used. When a palette is not supplied at all, the spec section 15 starting palette is used.

## Mismatch note for Agent D (do not silently edit tests)

- Task wording says "pure TypeScript library, for example lib/rating/ or lib/". Agent C impl-gated tests require the exact path `lib/rating.js` (CommonJS require). This branch therefore ships the canonical library as `lib/rating.js` (JSDoc typed JavaScript, importable from TypeScript via `lib/rating.d.ts`) at the exact path the gated tests expect, rather than a TypeScript only file the gated tests cannot require. The interface matches the gated tests: `rateItem` exists, accepts the gated test input shape, and returns a truthy result. Routing note: if Agent D wants a TypeScript source file instead, route that decision to Agent C to update the gated import path; do not change the gated test on a backend branch.
- The gated rating tests themselves are interface skeletons: they check module presence and function presence, and only the first test calls `rateItem` with a fixture string and checks the result is truthy. They do not assert exact scores for the concrete cases. The concrete cases below were verified directly against this library, not through the gated tests, and the verification is recorded here.

## Concrete cases verified (spec sections 3 and 11.2)

- White collared shirt: score 84.2, Strong, nearest Cool White. Holds as Strong neutral.
- Navy sweater: score 94.25, Perfect, nearest Navy. Holds as Perfect or Strong.
- Emerald knit: score 86.2, Strong, nearest Emerald Green. Holds as Perfect or Strong.
- Warm orange hoodie: score 34.21, Avoid, reason mentions warm oranges avoid range. Holds.
- Light pastel tee: score 40, Avoid, reason mentions light pastels avoid range. Holds.
- Muted olive item: score 30.29, Avoid, reason mentions muted earthy hues avoid range. Holds (spec allows Avoid or Works as accent only at most).
- Camel item: score 4.32, Avoid, reason mentions muted earthy hues avoid range. Holds.
- Multi colour navy base with warm orange stripe at 30 percent: score 85 (100 minus 15), Strong, secondaryClash true, rule warm oranges. Holds. At 20 percent the clash does not fire, which matches the over 25 percent rule.

## Decisions recorded

- Cool white swatch: the starting palette adds Cool White (#E6EAEE) alongside the spec section 15 neutrals, because spec section 5.4 discusses true and cool white and section 11.2 requires a white shirt to be a Strong neutral. A pure white shirt scores 84.2 (Strong) against this swatch, not Perfect.
- Achromatic white exemption: pure white would otherwise match the stored light pastel range (saturation below 45, lightness above 75). Near white achromatic colours (saturation 12 or below, lightness 88 or above) are treated as neutrals and skip avoid matching. A pale coloured pastel (fixture #E8DDE6) still matches the stored pastel range and rates Avoid.
- Multiple avoid matches: when a colour matches several avoid rules, the muted earthy rule is preferred for the reason, so camel cites the muted earthy range as spec section 11.2 expects, rather than warm oranges.
- Core saturation penalty threshold: "much less saturated" is implemented as 25 saturation points or more below the swatch. This threshold is a backend interpretation, recorded here for Agent D; the spec does not give a number.
- Contract change: No contract change. This branch implements the rating formula the contract references for item scoring and palette re-rate.

## How to test

- Run: `node -e "const r = require('./lib/rating.js'); console.log(r.rateItem({primary:'white collared shirt fixture'})); console.log(r.rateItem({primary:'warm orange hoodie'}));"` from the repo root.
- Run: `sh scripts/check-tests.sh` from the repo root. The impl-gated rating tests should now run for real instead of being skipped.

## Test results

- Agent C suite on this branch: see the run below (recorded at commit time). Expected change from baseline: the 4 impl-gated rating tests turn from skipped to pass, so pass rises by 4 and skipped falls by 4, with fail still 0. The exact counts are in the commit verification output.
- No Agent C test was edited.

## Mismatch or blocked items

- Blocked: none for the rating formula itself. The rating engine is not yet wired into item creation or palette re-rate; that wiring lands with ISSUE-06 (item auto rating on create) and ISSUE-05 (re-rate all items), which depend on this library.
- No secrets added. No em dashes added (checked by grep before commit).
