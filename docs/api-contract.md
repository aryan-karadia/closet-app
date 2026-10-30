# API Contract (placeholder, Agent B to fill)

Status: DRAFT, not frozen. Agent B owns this file. Agent C owns contract tests for it. Any change after freezing goes through Agent D.

## Rules

- Frontend (Agent A) consumes only endpoints listed here. It must not invent endpoints.
- Backend (Agent B) must keep the contract stable. A breaking change needs Agent D approval and an Agent C contract test update.
- All endpoints require authentication, except the documented auth callback flow. Unauthenticated requests return 401.
- All endpoints return JSON. Error shape, validation errors, and pagination must be documented here by Agent B before Agent A builds against an endpoint.
- Storage is Supabase Storage first, behind a StorageProvider abstraction. No separate S3 bucket in MVP.

## Endpoints to be defined by Agent B

Agent B will fill in, for each resource below, method, path, request schema, response schema, auth, validation, and error cases:
- Auth session and Google Auth callback (via Supabase Auth)
- Palettes and palette colours
- Avoid rules
- Items and item colours
- Image upload and signed URLs
- Advice rules
- Outfits and outfit items
- Wear logs
- Data export

## OpenAPI

Agent B may add an OpenAPI file alongside this document, for example `docs/openapi.yaml`, if it helps Agent A and Agent C. If both exist, they must agree, and this document is the human readable source of truth for decisions, while OpenAPI is the machine readable schema.
