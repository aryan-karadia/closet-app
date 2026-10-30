# ISSUE-21: API auth guard and session endpoint

- Epic: E4
- Owner agent: B
- Status: open
- Dependencies: ISSUE-23
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Every API endpoint except the documented auth callback rejects unauthenticated requests with 401. Session handling is documented in docs/api-contract.md. No service role key in client code.

## Definition of done

- Work is on a branch named `feat/ISSUE-21-<short-slug>`, `fix/ISSUE-21-<short-slug>`, or `test/ISSUE-21-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
