# ISSUE-24: Supabase schema migrations and RLS policies

- Epic: E5
- Owner agent: B
- Status: open
- Dependencies: ISSUE-23
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Postgres migrations for profiles, palettes, palette colours, avoid rules, items, item colours, advice rules, outfits, outfit items, and wear logs, with RLS on user_id for every table, and a documented migration order.

## Definition of done

- Work is on a branch named `feat/ISSUE-24-<short-slug>`, `fix/ISSUE-24-<short-slug>`, or `test/ISSUE-24-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
