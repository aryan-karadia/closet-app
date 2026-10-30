# Workflow and merge rules

Agent D is the overseer and the only merger to main. No other agent pushes directly to main, and no feature work lands on main directly after the Phase 0 planning commit.

## Branches

- Main branch: `main`. Protected in practice by Agent D review, even though there is no remote yet.
- Feature branches: `feat/<issue-id>-<short-slug>`
- Fix branches: `fix/<issue-id>-<short-slug>`
- Test branches: `test/<issue-id>-<short-slug>`

Example: `feat/ISSUE-01-palette-crud-api`

## Commits

- Every commit message must reference its issue, for example: `feat: add palette correction screen (refs ISSUE-04)`
- Keep commits small and focused on one issue.
- Never commit secrets, API keys, passwords, real Supabase credentials, or `.env.local`. Check with `git status` and a secrets scan before every merge.
- Never use em dashes in any writing, docs, code comments, or commit messages produced for this repo.

## Pull request style descriptions (no remote yet)

For every feature branch, create `docs/prs/<branch>.md` stating:
- Issue closed
- What changed
- How to test
- Test results, including which Agent C tests passed or failed
- Any contract change, or the statement "No contract change"

## Merge gate (Agent D only)

Agent D may merge a branch to main only after all of these are true:
1. Agent C tests for that issue pass.
2. The change matches the build spec and the frozen API contract for that issue.
3. Agent D has reviewed the branch.
4. No secrets are committed.
5. The PR description file exists and is accurate.

Record every merge in `docs/merges.md` with date, branch, issue, tests, and Agent D approval.

## Mismatch routing

If there is a mismatch, for example frontend expects a field the backend did not provide, or a test fails against the contract:
1. Stop that line of work.
2. Report it to Agent D.
3. Agent D routes the task to the correct owner agent.
4. Update the contract, test, or issue as needed, through Agent D.
5. Record the routing decision in `docs/merges.md` or in the affected issue file under "Routing notes".

Do not silently change a contract or a test to make code pass. A contract change goes through Agent D, and Agent C updates contract tests.

## Agent ownership

- Agent A: frontend only. Next.js UI, Google Auth via Supabase Auth, protected routes, and the browser rule engine in `lib/outfit-engine/`. Consumes only API contracts made by Agent B. Must not access Supabase Postgres or Storage directly for data, except for the auth session itself. Must not invent endpoints. Missing or mismatched endpoints go to Agent D, who routes them to Agent B.
- Agent B: backend only. API contracts first, then endpoints, Supabase Postgres tables and RLS, Supabase Storage via a StorageProvider abstraction, signed URLs, validation, and CRUD. Must not build frontend UI.
- Agent C: QA first, before feature code. Writes unit and integration tests based on the spec, not on code. Tests are the acceptance gate for Agent A and Agent B.
- Agent D: overseer, coordinator, and only merger to main. Communicates between agents, handles mismatches, and records decisions.
