# ISSUE-12: Wardrobe grid filters, sort, and search

- Epic: E2
- Owner agent: A
- Status: merged
- Dependencies: ISSUE-06, ISSUE-11
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

Grid with photo, category, score badge, verdict, season, and fit tags. Filters by category, verdict, season, fit tag, status, colour family, and search by name or tag. Sort by palette score, least worn, recently added, or name. Spec section 7.

## Definition of done

- Work is on a branch named `feat/ISSUE-12-<short-slug>`, `fix/ISSUE-12-<short-slug>`, or `test/ISSUE-12-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D in the Agent A merge order recorded in docs/merges.md. See merges.md for blocked items from Agent A, including dislike endpoint, account delete endpoint, storage usage endpoint, avoidTag, swatch sampling partial, and live Google sign in and Android PWA verification still pending.
