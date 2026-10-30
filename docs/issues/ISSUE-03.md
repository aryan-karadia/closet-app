# ISSUE-03: PDF text extraction and beauty section filter, browser

- Epic: E1
- Owner agent: A
- Status: merged
- Dependencies: ISSUE-01 contract frozen for palette read
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

Browser pdf.js text extraction classifies core, neutral, avoid, and ignore sections. Makeup, blush, lip, hair, nail, and Facetune sections are ignored and never saved as clothing colours unless the user explicitly adds them. Spec section 4.3 steps 1 and 4.

## Definition of done

- Work is on a branch named `feat/ISSUE-03-<short-slug>`, `fix/ISSUE-03-<short-slug>`, or `test/ISSUE-03-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D in the Agent A merge order recorded in docs/merges.md. See merges.md for blocked items from Agent A, including dislike endpoint, account delete endpoint, storage usage endpoint, avoidTag, swatch sampling partial, and live Google sign in and Android PWA verification still pending.
