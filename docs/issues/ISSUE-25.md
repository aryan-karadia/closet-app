# ISSUE-25: StorageProvider abstraction, private bucket, signed URLs

- Epic: E5
- Owner agent: B
- Status: merged
- Dependencies: ISSUE-24
- Spec reference: See acceptance criteria and the build spec.

## Acceptance criteria

StorageProvider interface with upload and getSignedUrl, Supabase Storage implementation in MVP, private bucket, short lived signed URLs, no public bucket. Future R2 or MinIO implementation must only implement this interface. Spec section 16.4.

## Definition of done

- Work is on a branch named `feat/ISSUE-25-<short-slug>`, `fix/ISSUE-25-<short-slug>`, or `test/ISSUE-25-<short-slug>`.
- Every commit references this issue.
- A PR description file exists at `docs/prs/<branch>.md` with issue closed, what changed, how to test, and test results.
- Agent C tests for this issue pass.
- The change matches the spec and the frozen API contract for this issue.
- No secrets are committed, and no em dashes are used in docs or code comments.
- Agent D merges the branch to main and records the merge in `docs/merges.md`.

## Routing notes

Merged to main 2026-10-30 by Agent D in the Agent B merge order recorded in docs/merges.md. Contract for this issue is still DRAFT until Agent D freezes it after Agent C contract test update. See merges.md for known limitations and mismatches.
