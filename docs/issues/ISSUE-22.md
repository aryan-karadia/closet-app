# ISSUE-22: Settings and profile edit

- Epic: E4
- Owner agent: A
- Status: open
- Dependencies: ISSUE-20
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

Settings screen with profile (build, fit, sizes, style direction), palette management link, data export link, delete account confirmation, and storage usage warning at 80 percent. Spec sections 10 and 16.7.

## Definition of done

- Work is on a branch named `feat/ISSUE-22-<short-slug>`, `fix/ISSUE-22-<short-slug>`, or `test/ISSUE-22-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
