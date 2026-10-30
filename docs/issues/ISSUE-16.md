# ISSUE-16: Browser rule engine, pruned beam search in Web Worker

- Epic: E3
- Owner agent: A
- Status: open
- Dependencies: ISSUE-10, ISSUE-15, ISSUE-29 tests first
- Spec reference: See acceptance criteria and the build spec.


Fixed stack for Agent A: Tailwind CSS, shadcn/ui, React, Next.js with TypeScript. No Vue, no other UI framework. See docs/stack-decision-agent-a.md, recorded 2026-10-30.

## Acceptance criteria

Pure TypeScript engine in lib/outfit-engine/, run in a Web Worker, using precomputed item data from the API. Pruned beam search per spec section 16.6: filter, anchor on top 10 bottoms preferring neutrals, build up, score, keep top 20, enforce diversity. Never brute force all combinations. No LLM in the outfit path.

## Definition of done

- Work is on a branch named `feat/ISSUE-16-<short-slug>`, `fix/ISSUE-16-<short-slug>`, or `test/ISSUE-16-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
