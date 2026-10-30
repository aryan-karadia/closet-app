# ISSUE-09: Browser background removal confirm flow and colour clustering

- Epic: E2
- Owner agent: A
- Status: open
- Dependencies: ISSUE-08 contract frozen
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

User sees a cutout and can confirm or retake. If background removal fails, the user can save manually with score marked manual, not auto rated. Colour clustering uses garment pixels only, k equals 4 or equivalent, small clusters under 5 percent discarded unless a clear accent. Spec sections 5.1 and 5.2.

## Definition of done

- Work is on a branch named `feat/ISSUE-09-<short-slug>`, `fix/ISSUE-09-<short-slug>`, or `test/ISSUE-09-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
