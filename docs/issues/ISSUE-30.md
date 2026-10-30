# ISSUE-30: Contract test skeletons and CI check script

- Epic: E6
- Owner agent: C
- Status: merged
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

Contract update merged 2026-10-30 by Agent D. Contract still DRAFT pending Agent B fix for duplicate outfit item (ISSUE-13) and OpenAPI alignment (ISSUE-23), plus Agent C live re-run, before Agent D freezes it.

## Routing notes

Merged to main 2026-10-30 by Agent D, merge commit 8d344d2. Contract tests remain skeletons until Agent B drafts and Agent D freezes the API contract (ISSUE-23). Blocked items from Agent C TEST-PLAN.md: frozen contract missing, production function signatures missing, no test server yet. These are not guessed, they are routed to Agent B via Agent D.
