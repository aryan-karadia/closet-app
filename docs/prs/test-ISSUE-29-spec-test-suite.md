# PR description: test/ISSUE-29-spec-test-suite

Branch: test/ISSUE-29-spec-test-suite
Status: Unmerged. For Agent D review and merge only. Do not merge to main
from this branch without Agent D approval.

## Issues closed

- ISSUE-29: Spec based unit and integration test suite
- ISSUE-30: Contract test skeletons and CI check script

Note on issue branch naming: the task for this work names the branch
test/ISSUE-29-spec-test-suite, covering both ISSUE-29 and ISSUE-30 in one
test gate branch. Every commit references ISSUE-29, and commits for
contract skeletons also reference ISSUE-30.

## What changed

- Added tests/unit/ with 58 spec unit tests: palette ingester, item rating
  Delta E tiers and avoid rules, outfit builder hard rules, advice rules
  enable and disable, auth expectations, and API contract skeletons.
- Added tests/integration/ with 16 spec flow tests: palette flow, outfit
  flow, API contract skeletons, and auth flow.
- Added tests/impl-gated/ with 24 implementation-gated tests: rating
  engine, outfit engine, palette ingester, advice rules, and API plus auth.
  19 are skipped (RED, awaiting implementation) and 5 are gate state
  markers only. No production behaviour is faked green.
- Added tests/fixtures/spec-data.js and tests/helpers/spec-rules.js as
  spec tables and a spec oracle. These are test only. Production code must
  not import them.
- Added tests/TEST-PLAN.md mapping each test to a spec section and issue,
  with GREEN, RED, and SKELETON status, plus Blocked items.
- Added scripts/check-tests.sh, which runs the suite with Node built-in
  test runner (node:test), no dependencies to install, and reports total,
  pass, fail, and pending counts.
- Did not change docs/api-contract.md into a final contract. That file
  stays a placeholder owned by Agent B (ISSUE-23). Contract tests here are
  skeletons only, and every skeleton test file states that paths are to be
  confirmed against the frozen contract.
- No production feature code was added. No secrets were added. No em
  dashes are used in this branch.

## How to test

From the repo root:

```
sh scripts/check-tests.sh
```

No install step is required. Node built-in test runner only. For live API
tests, set CLOSET_TEST_BASE_URL to a test server URL. Without it, live
tests are skipped and reported as pending, which is the expected state
until backend code lands.

## Test results

Latest run, 2026-10-30, before any feature code:

- Total: 98
- Pass: 79
- Fail: 0
- Pending (skipped, RED awaiting implementation): 19
- Spec GREEN passes: 74 (58 unit plus 16 integration)
- Implementation-gated markers: 5 passes that only record gate state

This is a test gate, not a feature pass. Agent D must not treat this as
proof that Agents A or B features work, because those features do not
exist yet. The 19 pending tests are the gate those features must pass.

## Contract change

No contract change. Contract tests are skeletons awaiting the frozen
contract in docs/api-contract.md (ISSUE-23). See tests/TEST-PLAN.md under
Blocked for the two items Agent D must route: frozen contract, and
production function signatures.

## Files created

- tests/fixtures/spec-data.js
- tests/helpers/spec-rules.js
- tests/unit/palette-ingester.test.js
- tests/unit/item-rating.test.js
- tests/unit/outfit-builder.test.js
- tests/unit/advice-rules.test.js
- tests/unit/auth.test.js
- tests/unit/api-contract.test.js
- tests/integration/palette-flow.test.js
- tests/integration/outfit-flow.test.js
- tests/integration/api-contract.test.js
- tests/integration/auth-flow.test.js
- tests/impl-gated/rating-engine.test.js
- tests/impl-gated/outfit-engine.test.js
- tests/impl-gated/palette-ingester.test.js
- tests/impl-gated/advice-rules.test.js
- tests/impl-gated/api-and-auth.test.js
- tests/TEST-PLAN.md
- scripts/check-tests.sh
- docs/prs/test-ISSUE-29-spec-test-suite.md (this file)
