# ISSUE-31: Integration gate, A plus B plus C end to end

- Epic: E6
- Owner agent: C
- Status: open
- Dependencies: All merged issues
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

End to end pass of Agent C tests against Agent A frontend and Agent B backend per issue, with mismatches routed by Agent D and recorded. No issue is marked done unless its tests pass and Agent D merges it to main.

## Definition of done

- Work is on a branch named `feat/ISSUE-31-<short-slug>`, `fix/ISSUE-31-<short-slug>`, or `test/ISSUE-31-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
