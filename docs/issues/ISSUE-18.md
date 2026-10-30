# ISSUE-18: Advice Rules editor UI

- Epic: E3
- Owner agent: A
- Status: open
- Dependencies: ISSUE-15
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

List rules with enabled toggle, reason, source, edit, add, and delete. Starting rules from spec section 6.5 are present as editable records, not code constants, and a disabled rule never affects scoring.

## Definition of done

- Work is on a branch named `feat/ISSUE-18-<short-slug>`, `fix/ISSUE-18-<short-slug>`, or `test/ISSUE-18-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
