# ISSUE-11: Item add, edit, and detail UI with score badge

- Epic: E2
- Owner agent: A
- Status: open
- Dependencies: ISSUE-06, ISSUE-07, ISSUE-10
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

Add, edit, detail, soft delete with 30 day restore, score badge with number plus verdict text for colour blind friendly use, dominant colours with percentages, nearest palette colour, reason, and manual override with note. Spec sections 5.1, 5.4, and 7.

## Definition of done

- Work is on a branch named `feat/ISSUE-11-<short-slug>`, `fix/ISSUE-11-<short-slug>`, or `test/ISSUE-11-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
