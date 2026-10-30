# API Contract Freeze

- Date frozen: 2026-10-30
- Frozen by: Agent D
- Contract sources: docs/api-contract.md and docs/openapi.yaml, as merged to main including fix/ISSUE-23-openapi-alignment. Where they disagree, the contract doc wins, but after this freeze they should agree, per the OpenAPI alignment fix.
- Status before freeze: DRAFT, from Agent B, updated by Agent C contract tests, fixed by Agent B for duplicate outfit item and OpenAPI alignment, verified live by Agent D.
- Live verification at freeze: total 135, pass 127, fail 0, skipped 8 against a local dev server. Non-live: total 135, pass 113, fail 0, skipped 22.
- What Agent A may rely on: all endpoints, request schemas, response schemas, auth rules, validation, and error shape in the frozen contract, for the issues Agent A is assigned.
- Change rule: no contract change without Agent D approval and an Agent C contract test update. If Agent A finds a missing or mismatched endpoint, Agent A reports it to Agent D, who routes it to Agent B. Agent A must not invent endpoints, and Agent B must not change the contract silently.
- Known limitation at freeze: no live Supabase project has been exercised. Local mode is fully tested. Supabase backed behaviour remains untested until ISSUE-31.
