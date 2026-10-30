# ISSUE-33: Diversity fill must not repeat top and outer pairs

- Epic: E3
- Owner agent: A
- Status: open
- Dependencies: ISSUE-16, ISSUE-31 gate bug 2
- Spec reference: See acceptance criteria and the build spec, and tests/INTEGRATION-GATE.md.

## Acceptance criteria

buildOutfits in lib/outfit-engine/index.js must fill only with distinct top and outer pairs, or return fewer than 3 outfits with a message when a small wardrobe cannot supply 3 distinct pairs. A small wardrobe must never return repeated pairs silently.

## Definition of done

- Work is on a branch named `feat/ISSUE-33-<short-slug>`, `fix/ISSUE-33-<short-slug>`, or `test/ISSUE-33-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass, and the ISSUE-31 gate is re-run.
- The change matches the spec and the frozen API contract for this issue, or a contract change goes through Agent D with an Agent C test update.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Created 2026-10-30 by Agent D from the ISSUE-31 integration gate, which failed. See docs/merges.md, Merge: test/ISSUE-31-integration-gate.
