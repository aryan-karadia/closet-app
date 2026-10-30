# ISSUE-20: Google Auth via Supabase Auth, session, protected routes

- Epic: E4
- Owner agent: A
- Status: open
- Dependencies: ISSUE-21 contract for session guard
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Google sign in only, kept simple, session handling, protected routes, unauthenticated users redirected to sign in. No other auth method in MVP. Spec sections 9 and 16.

## Definition of done

- Work is on a branch named `feat/ISSUE-20-<short-slug>`, `fix/ISSUE-20-<short-slug>`, or `test/ISSUE-20-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
