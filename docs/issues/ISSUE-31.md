# ISSUE-31: Integration gate, A plus B plus C end to end

- Epic: E6
- Owner agent: C
- Status: open (gate failed, see routing notes)
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

Gate failed 2026-10-30, report merged to main as baa85b2, but ISSUE-31 stays open. Bugs routed: ISSUE-32 shuffle bypass (Agent A), ISSUE-33 diversity fill (Agent A), ISSUE-34 interview null verdict decision (Agent D). Spec gaps and unproven items are listed in tests/INTEGRATION-GATE.md and docs/merges.md. Re-run the gate after fixes before any MVP-done claim.
