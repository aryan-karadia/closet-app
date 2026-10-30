# ISSUE-05: Palette versioning and re-rate all items

- Epic: E1
- Owner agent: B
- Status: merged
- Dependencies: ISSUE-01, ISSUE-10
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Saving a new palette creates a new version, keeps the previous version, and re-rates all items in the background with progress shown. Items are not deleted on palette change. Spec section 4.3 step 5.

## Definition of done

- Work is on a branch named `feat/ISSUE-05-<short-slug>`, `fix/ISSUE-05-<short-slug>`, or `test/ISSUE-05-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D in the Agent B merge order recorded in docs/merges.md. Contract for this issue is still DRAFT until Agent D freezes it after Agent C contract test update. See merges.md for known limitations and mismatches.
