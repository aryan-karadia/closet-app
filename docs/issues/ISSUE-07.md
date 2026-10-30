# ISSUE-07: Item colour storage API

- Epic: E2
- Owner agent: B
- Status: open
- Dependencies: ISSUE-06
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Item colours stored with hex, Lab values, percentage, and primary flag, up to 3 dominant colours, per spec section 5.2. API returns colours with the item or via a documented subresource, as frozen in the contract.

## Definition of done

- Work is on a branch named `feat/ISSUE-07-<short-slug>`, `fix/ISSUE-07-<short-slug>`, or `test/ISSUE-07-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
