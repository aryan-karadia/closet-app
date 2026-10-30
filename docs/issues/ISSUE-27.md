# ISSUE-27: PWA manifest, install, and offline wardrobe view

- Epic: E5
- Owner agent: A
- Status: open
- Dependencies: ISSUE-12, ISSUE-19
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

PWA manifest, installable on Android, saved outfits and wardrobe grid viewable offline after first load. If offline generation is not supported, the UI states the limitation. No Play Store publishing in MVP. Spec sections 9, 10, and 11.4.

## Definition of done

- Work is on a branch named `feat/ISSUE-27-<short-slug>`, `fix/ISSUE-27-<short-slug>`, or `test/ISSUE-27-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
