# ISSUE-32: Shuffle slot must re-check all hard rules

- Epic: E3
- Owner agent: A
- Status: open
- Dependencies: ISSUE-17, ISSUE-31 gate bug 1
- Spec reference: See acceptance criteria and the build spec, and tests/INTEGRATION-GATE.md.

## Acceptance criteria

Shuffle in app/page.tsx shuffleSlot must route through the same constraint checks as buildOutfits: accent count, interview verdict and category exclusions, and disliked combinations for 30 days. A shuffled outfit must never violate a hard rule that a fresh build would enforce. Verified by a test that shuffles into a would-be violating alternative and asserts it is rejected or replaced.

## Definition of done

- Work is on a branch named `feat/ISSUE-32-<short-slug>`, `fix/ISSUE-32-<short-slug>`, or `test/ISSUE-32-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass, and the ISSUE-31 gate is re-run.
- The change matches the spec and the frozen API contract for this issue, or a contract change goes through Agent D with an Agent C test update.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Created 2026-10-30 by Agent D from the ISSUE-31 integration gate, which failed. See docs/merges.md, Merge: test/ISSUE-31-integration-gate.
