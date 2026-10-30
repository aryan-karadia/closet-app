# ISSUE-01: Palette and palette colour CRUD API

- Epic: E1
- Owner agent: B
- Status: open
- Dependencies: None, after ISSUE-23 contract draft
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Create, read, update, delete, and list palettes and palette colours per spec section 4.4. Authenticated user only, RLS enforced, validation errors documented in docs/api-contract.md. Agent C contract tests pass.

## Definition of done

- Work is on a branch named `feat/ISSUE-01-<short-slug>`, `fix/ISSUE-01-<short-slug>`, or `test/ISSUE-01-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
