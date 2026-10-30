# ISSUE-26: Validation and error handling standard

- Epic: E5
- Owner agent: B
- Status: merged
- Dependencies: ISSUE-23
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Every endpoint uses the same JSON error shape, validation errors, 401 for unauthenticated, 403 for wrong owner, 404 for missing resource, and 400 for invalid input, all documented in docs/api-contract.md.

## Definition of done

- Work is on a branch named `feat/ISSUE-26-<short-slug>`, `fix/ISSUE-26-<short-slug>`, or `test/ISSUE-26-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D in the Agent B merge order recorded in docs/merges.md. Contract for this issue is still DRAFT until Agent D freezes it after Agent C contract test update. See merges.md for known limitations and mismatches.
