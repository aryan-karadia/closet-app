# ISSUE-29: Spec based unit and integration test suite

- Epic: E6
- Owner agent: C
- Status: merged
- Dependencies: None, runs first, based on spec not code
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Unit and integration tests under tests/ based only on the spec, covering palette ingester, rating tiers and avoid rules, outfit hard rules, advice rules enable and disable, auth rejection, and API contract schemas and error cases. Includes TEST-PLAN.md mapping each test to a spec section and issue, with red/green status.

## Definition of done

- Work is on a branch named `feat/ISSUE-29-<short-slug>`, `fix/ISSUE-29-<short-slug>`, or `test/ISSUE-29-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D, merge commit 8d344d2. Contract tests remain skeletons until Agent B drafts and Agent D freezes the API contract (ISSUE-23). Blocked items from Agent C TEST-PLAN.md: frozen contract missing, production function signatures missing, no test server yet. These are not guessed, they are routed to Agent B via Agent D.
