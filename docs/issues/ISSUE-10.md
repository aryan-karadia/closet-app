# ISSUE-10: Delta E rating engine, shared pure TypeScript lib

- Epic: E2
- Owner agent: B
- Status: open
- Dependencies: ISSUE-01, ISSUE-02, ISSUE-29 tests first
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

Rating per spec section 5.3: score equals 100 minus Delta E times 2, clamped 0 to 100, neutral saturation cap, core saturation penalty, avoid cap at 40, secondary clash over 25 percent minus 15 points and flagged. Verdict tiers Perfect 90 to 100, Strong 70 to 89, Works 50 to 69, Avoid 0 to 49. White collared shirt equals Strong neutral, navy sweater equals Perfect or Strong, warm orange hoodie equals Avoid, light pastel tee equals Avoid.

## Definition of done

- Work is on a branch named `feat/ISSUE-10-<short-slug>`, `fix/ISSUE-10-<short-slug>`, or `test/ISSUE-10-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

None yet. Agent D records any mismatch routing here.
