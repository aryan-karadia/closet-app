# ISSUE-30: Contract test skeletons and CI check script

- Epic: E6
- Owner agent: C
- Status: open
- Dependencies: ISSUE-23 draft
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Contract test skeletons that Agent B contract must satisfy, plus a documented check script that Agent D runs before every merge. A contract change requires an Agent C test update through Agent D.

## Definition of done

- Work is on a branch named `feat/ISSUE-30-<short-slug>`, `fix/ISSUE-30-<short-slug>`, or `test/ISSUE-30-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
