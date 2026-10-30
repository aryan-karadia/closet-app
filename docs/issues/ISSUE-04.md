# ISSUE-04: Palette correction screen

- Epic: E1
- Owner agent: A
- Status: open
- Dependencies: ISSUE-01, ISSUE-03
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

User can rename, change role, change hex, delete, and add colours, use Remove beauty colours, and see a summary with counts and a warning if zero neutrals or zero avoids. Nothing is final until the user approves and saves. Spec section 4.3 step 4.

## Definition of done

- Work is on a branch named `feat/ISSUE-04-<short-slug>`, `fix/ISSUE-04-<short-slug>`, or `test/ISSUE-04-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
