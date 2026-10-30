# ISSUE-34: Decide whether unrated items are excluded from interview builds

- Epic: E3
- Owner agent: D
- Status: decision recorded 2026-10-30, implementation open

## Decision recorded 2026-10-30, source: user choice

Allow unrated items in interview builds, with a warning.

Implementation rule, exact:
- Interview builds still reject Avoid items and still enforce interview category exclusions (no hoodies, no graphic tees).
- Perfect and Strong rated items are preferred and sorted first.
- Items with a null or missing paletteVerdict are allowed only as a fallback, and every such item and every outfit containing one must show a clear warning, for example "Unrated item included, palette fit not verified", in both the outfit card and the explanation.
- An outfit made only of unrated items must not be presented as a verified interview outfit.
- Do not silently treat unrated as Strong.

This decision was recorded by Agent D before any code fix, as required by the issue.
- Dependencies: ISSUE-16, ISSUE-31 gate bug 3
- Spec reference: See acceptance criteria and the build spec, and tests/INTEGRATION-GATE.md.

## Acceptance criteria

Agent D decision, recorded before any code fix: engine interview filter currently passes items with null paletteVerdict, since it only rejects when a verdict is set. Decide and record whether unrated items should be excluded from interview builds, or allowed with a warning, then route the fix to Agent A. Do not guess the decision in code.

## Definition of done

- Work is on a branch named `feat/ISSUE-34-<short-slug>`, `fix/ISSUE-34-<short-slug>`, or `test/ISSUE-34-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass, and the ISSUE-31 gate is re-run.
- The change matches the spec and the frozen API contract for this issue, or a contract change goes through Agent D with an Agent C test update.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Created 2026-10-30 by Agent D from the ISSUE-31 integration gate, which failed. See docs/merges.md, Merge: test/ISSUE-31-integration-gate.
