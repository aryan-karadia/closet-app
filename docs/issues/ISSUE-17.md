# ISSUE-17: Outfit Builder home screen

- Epic: E3
- Owner agent: A
- Status: merged
- Dependencies: ISSUE-13, ISSUE-14, ISSUE-16
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

Home screen after login with occasion, season, vibe selectors, Build button, 3 outfits with photos, scores, and why it works, actions Save, Log worn, Shuffle slot, and Dislike. Disliked combinations are not suggested again for 30 days. Empty slots are shown as missing, never invented. Spec sections 6.1, 6.2, 6.3, and 10.

## Definition of done

- Work is on a branch named `feat/ISSUE-17-<short-slug>`, `fix/ISSUE-17-<short-slug>`, or `test/ISSUE-17-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D in the Agent A merge order recorded in docs/merges.md. See merges.md for blocked items from Agent A, including dislike endpoint, account delete endpoint, storage usage endpoint, avoidTag, swatch sampling partial, and live Google sign in and Android PWA verification still pending.
