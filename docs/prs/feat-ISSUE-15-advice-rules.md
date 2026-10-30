# PR: feat/ISSUE-15-advice-rules

- Issue closed: ISSUE-15 (Advice rules CRUD API)
- Branch: feat/ISSUE-15-advice-rules
- Based on: feat/ISSUE-14-wear-logs. Merge order position: 14 of 16, after ISSUE-14 and before ISSUE-28. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, then this branch, then ISSUE-28, ISSUE-05.

## What changed

- Added `lib/advice-rules.js`: the starting advice rule library at the exact path Agent C impl-gated tests require (`lib/advice-rules.js`). It exports `STARTING_ADVICE_RULES` (the 10 spec section 6.5 rules, with condition, action, weight, reason, source, and enabled flag, plus the avoid tag where a rule has both a prefer and an avoid tag), `getStartingRules`, `enabledRules`, and `scoreFromEnabledRulesOnly`, which sums only enabled rule weights, so a disabled rule never affects scoring.
- Added `lib/advice-rules.d.ts`: TypeScript declarations for the library.
- Added `lib/api/advice-rules.js`: advice rule CRUD (create, list with enabled filter, get, update, delete) with action enum prefer, avoid, require, weight 0 to 100 default 50, reason, source, source text, and enabled flag, plus POST `/api/advice-rules/seed`, which creates the 10 starting rules when the user has none (201, seeded true) and returns the existing rules unchanged when they already have any (200, seeded false). Seed is idempotent and never duplicates the starting set.
- Registered the advice rule routes in `lib/api/router.js`.
- Contract change: No contract change. This branch implements the advice rule section of the ISSUE-23 contract.

## Mismatch note for Agent D

- The API contract fields for advice rules are conditionCategory, conditionFitTag, and conditionColourFamily. The library starting rules also carry an `avoidTag` for rules that have both a prefer tag and an avoid tag (for example Shoulders first prefers structured shoulders and avoids dropped shoulders). That avoid tag is not a contract field, so the API seed stores the prefer tag in conditionFitTag and the full fidelity rule, including avoidTag, lives in `lib/advice-rules.js` for the browser rule engine to use. If Agent D wants avoidTag in the contract, that is a contract change to route through Agent D and Agent C, not a silent addition on this branch.
- The gated advice tests are interface skeletons: they check module presence only. They do not assert the starting rule contents or disabled scoring. The contents and disabled scoring were verified directly against `lib/advice-rules.js` during development and are recorded here.

## How to test

- Run: `node -e "const a = require('./lib/advice-rules.js'); console.log(a.STARTING_ADVICE_RULES.length); console.log(a.scoreFromEnabledRulesOnly([{weight: 10, enabled: true}, {weight: 99, enabled: false}]));"` from the repo root. Expected: 10 and 10.
- Start the dev server and seed: `curl -X POST -H "Authorization: Bearer test:user-1" http://localhost:3101/api/advice-rules/seed` must return 201 with 10 rules; a second call must return 200 with seeded false and the same 10 rules.
- Run: `sh scripts/check-tests.sh` from the repo root. The impl-gated advice tests should now run for real instead of being skipped.

## Test results

- Agent C suite on this branch: see the run below (recorded at commit time). Expected change from baseline: the 2 impl-gated advice tests turn from skipped to pass, so pass rises by 2 and skipped falls by 2, with fail still 0.
- No Agent C test was edited.

## Mismatch or blocked items

- None beyond the avoidTag note above.
- No secrets added. No em dashes added (checked by grep before commit).
