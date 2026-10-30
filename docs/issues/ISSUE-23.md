# ISSUE-23: OpenAPI contract and docs/api-contract.md frozen v1

- Epic: E5
- Owner agent: B
- Status: open
- Dependencies: ISSUE-30 contract test skeletons
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

docs/api-contract.md is filled in with method, path, request schema, response schema, auth, validation, and error cases for every MVP endpoint, plus an OpenAPI file if used. Contract is frozen per issue only through Agent D. Frontend must not invent endpoints.

## Definition of done

- Work is on a branch named `feat/ISSUE-23-<short-slug>`, `fix/ISSUE-23-<short-slug>`, or `test/ISSUE-23-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
