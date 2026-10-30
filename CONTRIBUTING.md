# Contributing

This repo follows `WORKFLOW.md`. Read it first.

Quick rules:
- Never push to main.
- One issue, one feature branch, named `feat/<issue-id>-<short-slug>`, `fix/<issue-id>-<short-slug>`, or `test/<issue-id>-<short-slug>`.
- Every commit references its issue, for example `feat: add palette correction screen (refs ISSUE-04)`.
- Every branch needs a PR description file under `docs/prs/`.
- Only Agent D merges to main, after Agent C tests pass and Agent D reviews.
- No secrets in git. Use `.env.example` placeholders only.
- No em dashes in any writing or docs.
- If you are blocked on a missing decision, record it as a blocked issue and route it to Agent D. Do not guess a spec change.
