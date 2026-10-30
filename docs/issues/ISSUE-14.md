# ISSUE-14: Wear log CRUD and wear count

- Epic: E3
- Owner agent: B
- Status: merged
- Dependencies: ISSUE-13
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Logging an outfit as worn increments wear count for every item in it, records date and occasion, and updates cost per wear if price is known. Past wear logs keep deleted items as deleted item, without rewriting history. Spec sections 6.7 and 7.

## Definition of done

- Work is on a branch named `feat/ISSUE-14-<short-slug>`, `fix/ISSUE-14-<short-slug>`, or `test/ISSUE-14-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D in the Agent B merge order recorded in docs/merges.md. Contract for this issue is still DRAFT until Agent D freezes it after Agent C contract test update. See merges.md for known limitations and mismatches.
