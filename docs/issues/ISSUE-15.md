# ISSUE-15: Advice rules CRUD API

- Epic: E3
- Owner agent: B
- Status: open
- Dependencies: ISSUE-23
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Advice rules CRUD with condition, action (prefer, avoid, require), weight, reason, source, source text, and enabled flag, per spec sections 6.5 and 8. Disabled rules must not affect scoring, verified by Agent C tests.

## Definition of done

- Work is on a branch named `feat/ISSUE-15-<short-slug>`, `fix/ISSUE-15-<short-slug>`, or `test/ISSUE-15-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
