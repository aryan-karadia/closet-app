# ISSUE-06: Item CRUD API

- Epic: E2
- Owner agent: B
- Status: open
- Dependencies: ISSUE-23, ISSUE-24
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Item CRUD per spec section 8, with category, season, fit tags, status (in rotation, stored, archived), price optional, wear count, and nullable location field only. No physical location flow in MVP. Authenticated user only.

## Definition of done

- Work is on a branch named `feat/ISSUE-06-<short-slug>`, `fix/ISSUE-06-<short-slug>`, or `test/ISSUE-06-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
