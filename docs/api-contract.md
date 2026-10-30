# API Contract (DRAFT, not frozen)

Status: DRAFT, not frozen. Agent B owns this file. Agent D freezes it. Agent C owns contract tests for it. This document is the human readable source of truth for decisions. `docs/openapi.yaml` is the machine readable schema for the same endpoints. If they disagree, this document wins and the OpenAPI file must be corrected through Agent D. Do not present this contract as frozen until Agent D records the freeze in `docs/merges.md`.

Base URL in development: `http://localhost:3101` (local dev server, see `scripts/dev-server.js`). In production the API lives under the same Next.js app origin, with paths below.

## Rules

- Frontend (Agent A) consumes only endpoints listed here. It must not invent endpoints.
- Backend (Agent B) must keep the contract stable. A breaking change needs Agent D approval and an Agent C contract test update.
- All API endpoints require authentication, with one documented exception described in the Auth section: the Supabase Auth callback flow itself is not a bearer authenticated API call, because it is the redirect that establishes the session. It is not an API route that returns wardrobe data.
- All endpoints return JSON, except `POST /api/export`, which returns a ZIP file. Error shape, validation errors, and pagination are defined below and are the same for every endpoint.
- Storage is Supabase Storage first, behind a StorageProvider abstraction. No separate S3 bucket in MVP. The database stores a storage path only, never a public URL. Signed URLs are short lived.
- No real Supabase credentials, API keys, or passwords appear in this repo. Placeholders only, from `.env.example`.
- No em dashes are used in this document.

## Authentication

Method: Google Auth via Supabase Auth (spec section 16.3). The browser holds the Supabase session. API calls send it as:

```
Authorization: Bearer <supabase-access-token>
```

Local and test mode only: when Supabase environment variables are absent, or when `CLOSET_TEST_MODE=1`, the dev server accepts a test token of the form `Bearer test:<user-id>`. This is a local development and test convenience only. It must never be enabled in production, and it must never accept a real user id without a Supabase token when Supabase variables are present.

Auth callback flow (the documented exception): the user signs in with Google through Supabase Auth. Supabase redirects back to the app with a session (the standard Supabase Auth code exchange handled by the Supabase client in the browser). No wardrobe API endpoint is called without a session, and no API endpoint bypasses the auth guard for data access. The callback is therefore not listed as a data endpoint below, and there is no unauthenticated data route.

Session endpoint: `GET /api/auth/session` returns the current user for a valid token, or 401 without one. See the endpoint table.

Ownership: every resource row carries `userId`. A request for a resource owned by another user returns 403, even if the id exists. A request for a resource that does not exist at all returns 404. The server checks existence first, then ownership, so the 403 versus 404 distinction is deliberate and documented here.

## Error shape (ISSUE-26)

Every error response uses one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Plain language message.",
    "details": {
      "fieldName": "Plain language problem with this field."
    }
  }
}
```

`details` is present only for validation errors, and only when at least one field is at fault. Codes:

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid input, missing required field, bad enum, bad range, duplicate slot, or malformed JSON. |
| 401 | `UNAUTHENTICATED` | No token, or a token that is missing, malformed, or expired. |
| 403 | `FORBIDDEN` | The resource exists but belongs to another user. |
| 404 | `NOT_FOUND` | The resource does not exist, or a soft deleted item is requested as if it were live. |
| 405 | `METHOD_NOT_ALLOWED` | The path exists but the method is not listed here. |
| 500 | `INTERNAL_ERROR` | Unexpected server error. Message is generic and does not leak internals. |

Validation rules that apply everywhere:

- Unknown JSON fields are ignored, never rejected, so the frontend can send extra fields safely.
- Missing required fields, wrong types, empty strings for required strings, numbers out of range, and values outside a documented enum are all 400.
- Range fields (`hueMin`/`hueMax`, `saturationMin`/`saturationMax`, `lightnessMin`/`lightnessMax`) require min less than or equal to max. Wrapped hue ranges are not supported in MVP; use two rules if a range wraps past 360.
- Hex colours must match `^#[0-9A-Fa-f]{6}$`.
- ISO dates must parse as dates. `wornAt` may be a date or datetime string.
- `page` starts at 1 and `pageSize` is 1 to 100, default 20. Out of range values are clamped, not rejected, except non numeric values which are 400.
- List responses use the pagination envelope below. Single resource responses return the resource object directly.

## Pagination and list envelope

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

List query parameters, where a resource supports them: `page`, `pageSize`, plus the filters listed per resource. Sorting is by `sort` with values listed per resource; unknown sort values fall back to `recent`.

## Common fields

Every resource has `id` (UUID string) and `createdAt` (ISO datetime). Most resources also have `updatedAt`. All timestamps are ISO 8601 UTC strings. All ids in paths are the resource `id`.

Field naming: JSON uses camelCase (`paletteId`, `primaryColorHex`, `wearCount`). This matches spec section 8 field names, which the spec calls suggestions, with relationships preserved. Database column names in migrations use snake_case (`user_id`, `palette_id`); the API translates between them.

## Endpoint table

All paths are prefixed `/api`. All require authentication unless noted.

| Method and path | Purpose |
| --- | --- |
| GET `/api/auth/session` | Current session user. |
| GET `/api/profile` | Current user profile. Auto created on first authenticated call. |
| PATCH `/api/profile` | Update display name, fit tags, style direction, active palette. |
| GET `/api/palettes` | List palettes for the user. |
| POST `/api/palettes` | Create a palette. |
| GET `/api/palettes/:id` | Get one palette, with its colours and avoid rules embedded. |
| PATCH `/api/palettes/:id` | Update name, source file name, or active flag. |
| DELETE `/api/palettes/:id` | Delete a palette and its colours and avoid rules. Items are never deleted by this. |
| POST `/api/palettes/:id/activate` | Make this palette the active palette. Deactivates others. |
| POST `/api/palettes/:id/versions` | Create a new version copy of a palette. Body may set `activate: true`. |
| POST `/api/palettes/:id/rerate` | Re-rate all of the user's items against this palette. Returns counts. |
| GET `/api/palettes/:paletteId/colours` | List colours of a palette. Filter `role` (core, neutral, avoid). |
| POST `/api/palettes/:paletteId/colours` | Add a colour to a palette. |
| GET `/api/palettes/:paletteId/colours/:colourId` | Get one palette colour. |
| PATCH `/api/palettes/:paletteId/colours/:colourId` | Update a palette colour. |
| DELETE `/api/palettes/:paletteId/colours/:colourId` | Delete a palette colour. |
| GET `/api/palettes/:paletteId/avoid-rules` | List avoid rules of a palette. |
| POST `/api/palettes/:paletteId/avoid-rules` | Create an avoid rule. |
| GET `/api/palettes/:paletteId/avoid-rules/:ruleId` | Get one avoid rule. |
| PATCH `/api/palettes/:paletteId/avoid-rules/:ruleId` | Update an avoid rule. |
| DELETE `/api/palettes/:paletteId/avoid-rules/:ruleId` | Delete an avoid rule. |
| GET `/api/items` | List items, with filters and sort below. Deleted items are excluded. |
| POST `/api/items` | Create an item. May include up to 3 dominant colours, which are stored as item colours. |
| GET `/api/items/:id` | Get one item, with `colours` embedded and signed photo URLs when a photo path exists. |
| PATCH `/api/items/:id` | Update an item, including manual score override. |
| DELETE `/api/items/:id` | Soft delete an item (sets `deletedAt`). Wear logs keep their snapshot. |
| POST `/api/items/:id/restore` | Restore a soft deleted item within 30 days. |
| POST `/api/items/:id/permanent-delete` | Permanently delete an already soft deleted item. |
| GET `/api/items/:id/colours` | List item colours (up to 3 dominant colours). |
| POST `/api/items/:id/colours` | Replace the full item colour set (array, max 3, exactly one primary if non empty). |
| POST `/api/uploads` | Upload a compressed image (WebP only) through the StorageProvider. Returns the storage path, never a public URL. |
| POST `/api/uploads/signed-url` | Get a short lived signed URL for a storage path owned by the user. |
| GET `/api/storage/:path` | Local dev server only: serves a memory stored file when a valid signed token is supplied. Not a Supabase route. |
| GET `/api/outfits` | List outfits. Filter `occasion`, `saved`. |
| POST `/api/outfits` | Create an outfit with items by slot. |
| GET `/api/outfits/:id` | Get one outfit, with `items` (outfit items with slot) embedded. |
| PATCH `/api/outfits/:id` | Update occasion, season, vibe, scores, explanation, or saved flag. Item changes go through outfit items endpoints. |
| DELETE `/api/outfits/:id` | Delete an outfit and its outfit items. Wear logs are kept. |
| GET `/api/outfits/:outfitId/items` | List outfit items for an outfit. |
| POST `/api/outfits/:outfitId/items` | Add one item to an outfit in a slot. Duplicate slots are 400. |
| DELETE `/api/outfits/:outfitId/items/:itemId` | Remove an item from an outfit. |
| GET `/api/wear-logs` | List wear logs. Filter `outfitId`, `occasion`. |
| POST `/api/wear-logs` | Log an outfit as worn. Increments wear count for every listed item. |
| GET `/api/wear-logs/:id` | Get one wear log, with item snapshots embedded. |
| DELETE `/api/wear-logs/:id` | Delete a wear log. Decrements wear counts for its items, floored at 0. |
| GET `/api/advice-rules` | List advice rules. Filter `enabled` (true or false). |
| POST `/api/advice-rules` | Create an advice rule. |
| POST `/api/advice-rules/seed` | Create the 10 spec section 6.5 starting rules, if none exist yet. Idempotent. |
| GET `/api/advice-rules/:id` | Get one advice rule. |
| PATCH `/api/advice-rules/:id` | Update an advice rule, including the enabled flag. |
| DELETE `/api/advice-rules/:id` | Delete an advice rule. |
| POST `/api/export` | Export all user data as a ZIP file (JSON plus stored photos). Returns `application/zip`. |

## Auth session

### GET /api/auth/session

Auth: required. Response 200:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com or null in test mode"
  }
}
```

Errors: 401 when unauthenticated. No other error case is expected for a valid token.

## Profile

Profile is one record per user, keyed by `userId`. It is auto created on first `GET /api/profile` with empty fit tags and null style fields, so the frontend never has to create it explicitly.

### GET /api/profile

Response 200:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "displayName": "Aryan or null",
  "fitTags": ["structured shoulder"],
  "styleDirection": "Deep Winter Softboy with structure or null",
  "activePaletteId": "uuid or null",
  "createdAt": "2026-10-30T00:00:00.000Z",
  "updatedAt": "2026-10-30T00:00:00.000Z"
}
```

### PATCH /api/profile

Request body, all fields optional:

```json
{
  "displayName": "string or null, max 100 chars",
  "fitTags": ["string, max 20 items"],
  "styleDirection": "string or null, max 200 chars",
  "activePaletteId": "uuid or null, must be a palette owned by the user"
}
```

Errors: 400 for bad types or an `activePaletteId` that does not belong to the user (treated as a validation error when the palette exists for another user, this endpoint returns 403 instead, consistent with the ownership rule; a palette id that does not exist at all is 400 because the reference cannot be resolved). To keep this simple and predictable: unknown palette id is 400, another user's palette id is 403.

## Palettes

### POST /api/palettes

Request:

```json
{
  "name": "Deep Winter (required, 1 to 100 chars)",
  "sourceFileName": "palette.pdf or null",
  "isActive": false
}
```

Response 201: palette object:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Deep Winter",
  "sourceFileName": "palette.pdf",
  "uploadedAt": "2026-10-30T00:00:00.000Z",
  "isActive": false,
  "version": 1,
  "colours": [],
  "avoidRules": [],
  "createdAt": "2026-10-30T00:00:00.000Z",
  "updatedAt": "2026-10-30T00:00:00.000Z"
}
```

Notes: creating a palette with `isActive: true` deactivates the user's other palettes. `version` starts at 1 and is only increased by the versions endpoint. `uploadedAt` is set at creation.

### GET /api/palettes

List envelope with palette objects (without embedded colours, to keep lists light). Query: `page`, `pageSize`, `isActive` (true or false). Sort: `recent` (default, newest first) or `name`.

### GET /api/palettes/:id

Response 200: palette object with `colours` and `avoidRules` embedded. Errors: 404 missing, 403 wrong owner.

### PATCH /api/palettes/:id

Body, all optional: `name`, `sourceFileName`, `isActive`. Setting `isActive: true` deactivates others. Setting `isActive: false` on the active palette leaves no active palette; the frontend should activate another one explicitly. Errors: 400, 403, 404.

### DELETE /api/palettes/:id

Response 200: `{ "deleted": true, "id": "uuid" }`. Colours and avoid rules of that palette are deleted with it. Items are never deleted. If the deleted palette was active, no palette is active afterwards. Errors: 403, 404.

### POST /api/palettes/:id/activate

No body required. Response 200: the palette object with `isActive: true`. Errors: 403, 404.

### POST /api/palettes/:id/versions

Body optional: `{ "activate": false, "name": "optional new name" }`. Creates a copy with `version` increased by 1, the same colours and avoid rules, and `isActive` set from `activate` (default false). The original palette is kept. Response 201: the new palette object with embedded colours and avoid rules. Errors: 403, 404.

### POST /api/palettes/:id/rerate

No body required. Re-rates every non deleted item of the user against this palette using the Delta E rating engine (spec section 5.3, ISSUE-10). For each item it updates `autoScore`, `paletteScore`, `paletteVerdict`, `nearestPaletteColorId`, `nearestPaletteColorName`, and `ratingReason`, except that an item with a manual score keeps its manual score as its effective `paletteScore` (the auto score is still updated and stored separately). Items with no primary colour are skipped and counted as skipped. Response 200:

```json
{
  "paletteId": "uuid",
  "reratedCount": 3,
  "skippedCount": 1,
  "totalCount": 4
}
```

Errors: 403, 404. This endpoint is synchronous in MVP. The spec background progress indicator is a frontend concern; the API returns counts when the re-rate finishes.

## Palette colours

Family enum: `blue, green, purple, red, teal, plum, burgundy, black, gray, navy, orange, brown, pink, yellow, white, other`. Role enum: `core, neutral, avoid`.

### POST /api/palettes/:paletteId/colours

Request:

```json
{
  "name": "Navy (required, 1 to 100 chars)",
  "hex": "#12284B (required, #RRGGBB)",
  "labL": "number 0 to 100, optional, derived from hex if omitted",
  "labA": "number, optional, derived from hex if omitted",
  "labB": "number, optional, derived from hex if omitted",
  "hue": "number 0 to 360, optional, derived from hex if omitted",
  "saturation": "number 0 to 100, optional, derived from hex if omitted",
  "lightness": "number 0 to 100, optional, derived from hex if omitted",
  "family": "navy (required, family enum)",
  "role": "neutral (required, core, neutral, or avoid)",
  "sourcePage": "integer 1 or above, or null",
  "isManual": false
}
```

Response 201: palette colour object with `id`, `paletteId`, and all fields above plus `createdAt` and `updatedAt`. Errors: 400 for bad hex, family, role, or ranges; 403 if the palette belongs to another user; 404 if the palette does not exist.

### GET /api/palettes/:paletteId/colours

List envelope. Query: `role`, `page`, `pageSize`. Sort: `name` or `recent`.

### GET, PATCH, DELETE /api/palettes/:paletteId/colours/:colourId

PATCH body: any palette colour field except `id` and `paletteId`, all optional, same validation as create. If `hex` changes and Lab or HSL fields are not supplied in the same request, they are re-derived from the new hex. DELETE response: `{ "deleted": true, "id": "uuid" }`. Errors: 400, 403 (palette or colour owned by another user), 404 (palette or colour missing, or colour not in this palette).

## Avoid rules

### POST /api/palettes/:paletteId/avoid-rules

Request:

```json
{
  "name": "warm oranges (required, 1 to 100 chars)",
  "hueMin": 20,
  "hueMax": 50,
  "saturationMin": 41,
  "saturationMax": 100,
  "lightnessMin": 30,
  "lightnessMax": 70,
  "description": "Warm oranges, saturation above 40, lightness 30 to 70. (optional)"
}
```

All range fields are required numbers: hue 0 to 360, saturation and lightness 0 to 100, min less than or equal to max. Response 201: avoid rule object with `id`, `paletteId`, and all fields plus timestamps. Errors: 400, 403, 404 as for palette colours.

### GET /api/palettes/:paletteId/avoid-rules

List envelope. Query: `page`, `pageSize`. Sort: `name` or `recent`.

### GET, PATCH, DELETE /api/palettes/:paletteId/avoid-rules/:ruleId

PATCH body: any avoid rule field except `id` and `paletteId`, all optional, same validation. DELETE response: `{ "deleted": true, "id": "uuid" }`. Errors: 400, 403, 404.

Spec starting avoid rules (spec sections 4.4 and 15, also used by the rating engine defaults): warm oranges (hue 20 to 50, saturation 41 to 100, lightness 30 to 70), light pastels (hue 0 to 360, saturation 0 to 44, lightness 76 to 100), muted earthy hues (hue 20 to 90, saturation 10 to 45, lightness 25 to 65).

## Items

Category is a free string in MVP (1 to 100 chars), because the spec does not fix a closed category list, and the frontend category picker owns the display list. Values the builder treats specially are `hoodie` and `graphic tee` (excluded from Interview outfits by the builder, spec section 6.4). Season enum: `winter, spring, autumn, summer, all-season`. Status enum: `in rotation, stored, archived`. Note the space in `in rotation`; it is the spec value, not `in_rotation`.

### POST /api/items

Request:

```json
{
  "name": "Navy sweater (required, 1 to 200 chars)",
  "category": "sweater (required, 1 to 100 chars)",
  "season": "winter (required, season enum)",
  "fitTags": ["relaxed body"],
  "status": "in rotation (optional, default in rotation)",
  "price": "number 0 or above, or null (optional)",
  "location": "string or null (optional, nullable field only, no location flow in MVP)",
  "photoPath": "items/<userId>/<itemId>.webp or null (storage path only, never a public URL)",
  "thumbnailPath": "items/<userId>/<itemId>-thumb.webp or null",
  "primaryColorHex": "#12284B or null",
  "paletteScore": "number 0 to 100 or null (if omitted and colours are given, the server rates the item against the active palette)",
  "paletteVerdict": "Perfect, Strong, Works, or Avoid, or null (derived with paletteScore when rated by the server)",
  "nearestPaletteColorId": "uuid or null",
  "nearestPaletteColorName": "string or null",
  "ratingReason": "string or null",
  "autoScore": "number 0 to 100 or null",
  "manualScore": "number 0 to 100 or null",
  "manualScoreNote": "string or null",
  "colours": [
    { "hex": "#12284B", "labL": 0, "labA": 0, "labB": 0, "percentage": 80, "isPrimary": true }
  ]
}
```

Notes:

- `colours` is optional, max 3 entries, each percentage 0 to 100, at most one primary. If `colours` is given with a primary colour and no explicit score, the server rates the item against the user's active palette (if one exists) and fills `autoScore`, `paletteScore`, `paletteVerdict`, `nearestPaletteColorId`, `nearestPaletteColorName`, and `ratingReason`. If a manual score is supplied, `paletteScore` is the manual score and `autoScore` keeps the auto value.
- If no active palette exists, scores stay as supplied, or null.
- `wearCount` starts at 0 and `lastWornAt` starts null. They are not settable on create; wear logs change them.
- `deletedAt` is null on create.

Response 201: item object:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Navy sweater",
  "category": "sweater",
  "season": "winter",
  "fitTags": ["relaxed body"],
  "status": "in rotation",
  "price": null,
  "location": null,
  "photoPath": null,
  "thumbnailPath": null,
  "primaryColorHex": "#12284B",
  "paletteScore": 92,
  "paletteVerdict": "Perfect",
  "nearestPaletteColorId": "uuid or null",
  "nearestPaletteColorName": "Navy or null",
  "ratingReason": "Plain language reason or null",
  "autoScore": 92,
  "manualScore": null,
  "manualScoreNote": null,
  "wearCount": 0,
  "lastWornAt": null,
  "costPerWear": null,
  "deletedAt": null,
  "colours": [],
  "createdAt": "2026-10-30T00:00:00.000Z",
  "updatedAt": "2026-10-30T00:00:00.000Z"
}
```

`costPerWear` is derived, never stored directly: when `price` is known and `wearCount` is above 0, it is `price / wearCount`, rounded to 2 decimals. Otherwise null.

### GET /api/items

List envelope of item objects (without embedded colours, to keep lists light; use the single item endpoint for colours). Query filters: `category`, `paletteVerdict` (Perfect, Strong, Works, Avoid), `season`, `fitTag` (matches one tag), `status`, `colourFamily` (matches primary colour family when the item has colours; items without colours are excluded when this filter is used), `search` (case insensitive substring on name or any fit tag). Sort: `paletteScore` (highest first), `wearCount` (least worn first), `recent` (default, newest first), `name`. Errors: 400 for a bad `paletteVerdict`, `season`, or `status` filter value.

### GET /api/items/:id

Response 200: item object with `colours` embedded, plus `photoSignedUrl` and `thumbnailSignedUrl` when the corresponding path exists. Signed URLs are short lived (see Uploads). They are generated on read, never stored. Errors: 403, 404 (including soft deleted items).

### PATCH /api/items/:id

Body: any writable item field except `id`, `userId`, `wearCount`, `lastWornAt`, `createdAt`, all optional, same validation as create. Supplying `manualScore` sets the effective `paletteScore` to the manual score without overwriting `autoScore`. Supplying `manualScore: null` clears the override and restores `paletteScore` to `autoScore` (or null). Changing `colours` through this endpoint is not supported; use the item colours endpoint to replace the set. Errors: 400, 403, 404.

### DELETE /api/items/:id

Soft delete: sets `deletedAt` and `status` to `archived`, and excludes the item from lists, single reads, outfit creation, and future builder input. Past wear logs keep their item snapshots, so history is not rewritten. Response 200: `{ "deleted": true, "id": "uuid", "softDeleted": true }`. Errors: 403, 404.

### POST /api/items/:id/restore

Clears `deletedAt` and restores `status` to `in rotation`, only when `deletedAt` is within the last 30 days. Older soft deletes return 400 with code `VALIDATION_ERROR` and a message stating the 30 day restore window has passed; use permanent delete instead. Response 200: the item object. Errors: 400 (window passed, or item was not deleted), 403, 404.

### POST /api/items/:id/permanent-delete

Only for an already soft deleted item. Hard deletes the item and its item colours. Outfit items referencing it are removed from their outfits. Wear log snapshots are kept. Response 200: `{ "deleted": true, "id": "uuid", "softDeleted": false }`. Errors: 400 (item is not soft deleted yet), 403, 404.

## Item colours

Item colours are the up to 3 dominant colours from spec section 5.2, stored in hex and Lab with percentages. The primary colour is the largest cluster.

### GET /api/items/:id/colours

List envelope of colour objects:

```json
{
  "id": "uuid",
  "itemId": "uuid",
  "hex": "#12284B",
  "labL": 15.2,
  "labA": 5.1,
  "labB": -25.4,
  "percentage": 80,
  "isPrimary": true,
  "family": "navy or null",
  "createdAt": "2026-10-30T00:00:00.000Z"
}
```

`family` is derived from hue when a hue can be derived from the hex, otherwise null. Errors: 403, 404.

### POST /api/items/:id/colours

Body: `{ "colours": [ ... ] }`, the full replacement set. Rules: max 3 entries, each with required `hex`, required `percentage` 0 to 100, optional Lab values (derived from hex if omitted), optional `isPrimary`. Exactly one primary is required when the set is non empty; if no entry is marked primary, the highest percentage entry becomes primary. If the set is empty, the item primary colour and scores are cleared to null. After replacement, if the item has no manual score and the user has an active palette, the item is re-rated against that palette and its score fields are updated. Response 200: list envelope of the new colour set. Errors: 400, 403, 404.

## Uploads and signed URLs

Image flow (spec section 16.4): the browser compresses before upload. The server accepts compressed images only.

### POST /api/uploads

Request JSON:

```json
{
  "itemId": "uuid or null (optional, used to build the storage path when the client does not supply a path)",
  "path": "items/<userId>/<itemId>.webp (optional, overrides the derived path, must start with items/<userId>/ or it is rejected with 403)",
  "fileName": "sweater.webp (optional, used only when deriving a path)",
  "contentType": "image/webp (required, only image/webp is accepted in MVP)",
  "kind": "image or thumbnail (required)",
  "width": "number, required: image 1 to 1200, thumbnail 1 to 400",
  "height": "number, required, 1 to 4000",
  "dataBase64": "base64 of the compressed WebP bytes (required)"
}
```

Validation: non WebP content types are 400. An image wider than 1200px or a thumbnail wider than 400px is 400, because the browser must compress before upload (spec section 9.1). A path that does not belong to the user is 403. Empty file data is 400. The maximum decoded size accepted is 5MB; larger uploads are 400.

Response 201:

```json
{
  "path": "items/<userId>/<itemId>.webp",
  "kind": "image",
  "contentType": "image/webp",
  "size": 123456,
  "signedUrl": "short lived signed URL, local or Supabase, see below",
  "expiresAt": "2026-10-30T01:00:00.000Z"
}
```

The response contains the storage path. The client must store the path in the item record (`photoPath` or `thumbnailPath`). It must never store the signed URL, which expires.

### POST /api/uploads/signed-url

Request: `{ "path": "items/<userId>/<itemId>.webp (required)", "expiresInSeconds": 3600 (optional, 60 to 86400, default 3600) }`. Response 200: `{ "path": "...", "signedUrl": "...", "expiresAt": "..." }`. Errors: 400 for a bad path or expiry, 403 for a path belonging to another user, 404 when the stored file does not exist.

Signed URL lifetime: short lived. The Supabase implementation uses Supabase Storage signed URLs. The local memory implementation returns a local URL under `/api/storage/...` with a token that expires at `expiresAt`. The bucket is private in both cases. There is no public bucket and no public URL in MVP.

### GET /api/storage/:path (local dev server only)

Serves a memory stored file only when the query token is valid and unexpired. This route exists so local development works without a Supabase project. In production with Supabase Storage, signed URLs point at Supabase, not at this route. Unauthenticated access to a file without a valid token is 401, an expired token is 401, and a missing file is 404.

## Outfits

Slot enum: `base-top, outer-layer, bottom, shoes, accessory`. At most one item per slot in an outfit. Empty slots are allowed. Occasion enum: `daily, interview, formal, japan-travel, date-evening`. Vibe enum, optional: `structured-softboy, clean-minimal, light-old-money, streetwear-minimal`.

### POST /api/outfits

Request:

```json
{
  "occasion": "daily (required, occasion enum)",
  "season": "winter (required, season enum, same values as items)",
  "vibe": "structured-softboy or null",
  "items": [
    { "itemId": "uuid", "slot": "base-top" }
  ],
  "paletteScore": "number 0 to 100 or null",
  "fitScore": "number 0 to 100 or null",
  "contrastScore": "number 0 to 100 or null",
  "rotationScore": "number 0 to 100 or null",
  "totalScore": "number 0 to 100 or null",
  "explanation": ["Plain language sentence per rule that fired."],
  "saved": false
}
```

Validation: `items` is optional and defaults to empty. Each entry requires an existing item owned by the user; an item owned by another user is 403, a missing item is 400 (because the outfit reference cannot be resolved; the single item endpoint still returns 404 for the item itself). Duplicate slots are 400. Duplicate item ids in one outfit are 400. Soft deleted items are 400. Scores, when supplied, must be 0 to 100. Response 201: outfit object with `items` embedded (each with `itemId`, `slot`, and the item name for display).

### GET /api/outfits

List envelope of outfit objects (without embedded items, to keep lists light). Query: `occasion`, `saved` (true or false), `page`, `pageSize`. Sort: `recent` (default) or `totalScore` (highest first).

### GET /api/outfits/:id

Response 200: outfit object with `items` embedded. Errors: 403, 404.

### PATCH /api/outfits/:id

Body: any outfit field except `id` and `items`, all optional, same validation as create. To change items, use the outfit items endpoints. Errors: 400, 403, 404.

### DELETE /api/outfits/:id

Deletes the outfit and its outfit items. Wear logs are kept, with their snapshots. Response 200: `{ "deleted": true, "id": "uuid" }`. Errors: 403, 404.

## Outfit items

### GET /api/outfits/:outfitId/items

List envelope of outfit item objects: `{ "outfitId": "uuid", "itemId": "uuid", "slot": "base-top", "itemName": "string or null", "createdAt": "..." }`. Errors: 403 (outfit owned by another user), 404 (outfit missing).

### POST /api/outfits/:outfitId/items

Body: `{ "itemId": "uuid (required)", "slot": "base-top (required, slot enum)" }`. Duplicate slot in the outfit is 400. Duplicate item in the outfit is 400. Response 201: the outfit item object. Errors: 400, 403, 404.

### DELETE /api/outfits/:outfitId/items/:itemId

Removes that item from the outfit. Response 200: `{ "deleted": true, "outfitId": "uuid", "itemId": "uuid" }`. Errors: 403, 404 (outfit missing, or item not in the outfit).

## Wear logs

### POST /api/wear-logs

Request:

```json
{
  "outfitId": "uuid (required, must be an outfit owned by the user)",
  "itemIds": ["uuid, at least one, each an item owned by the user"],
  "wornAt": "2026-10-30 or ISO datetime (optional, defaults to today)",
  "occasion": "daily or null (optional, occasion enum when supplied)",
  "note": "string or null, max 500 chars"
}
```

Effect: a wear log is created with an `itemSnapshots` array (each with `itemId` and `itemName` at log time, so later item deletion does not rewrite history), every listed item gets `wearCount` increased by 1 and `lastWornAt` set to `wornAt`, and each item's derived `costPerWear` updates accordingly. Response 201: wear log object:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "outfitId": "uuid",
  "itemIds": ["uuid"],
  "itemSnapshots": [{ "itemId": "uuid", "itemName": "Navy sweater" }],
  "wornAt": "2026-10-30T00:00:00.000Z",
  "occasion": "daily or null",
  "note": null,
  "createdAt": "2026-10-30T00:00:00.000Z",
  "updatedAt": "2026-10-30T00:00:00.000Z"
}
```

Errors: 400 for bad fields or empty `itemIds`; 403 for an outfit or item owned by another user; 404 for a missing outfit or item.

### GET /api/wear-logs

List envelope. Query: `outfitId`, `occasion`, `page`, `pageSize`. Sort: `recent` (default, by `wornAt` descending).

### GET /api/wear-logs/:id

Response 200: wear log object with `itemSnapshots` embedded. Errors: 403, 404.

### DELETE /api/wear-logs/:id

Deletes the wear log and decrements `wearCount` for each of its items, floored at 0. `lastWornAt` is left unchanged, because recomputing it from remaining logs is a later improvement and is recorded as a known limitation, not silently guessed. Response 200: `{ "deleted": true, "id": "uuid" }`. Errors: 403, 404.

## Advice rules

Action enum: `prefer, avoid, require`. A disabled rule must never affect scoring (spec section 6.5). The API stores rules; scoring itself lives in the browser rule engine (Agent A), which must read only enabled rules.

### POST /api/advice-rules

Request:

```json
{
  "name": "Shoulders first (required, 1 to 100 chars)",
  "conditionCategory": "top or outer (optional, string or null)",
  "conditionFitTag": "structured shoulder (optional, string or null)",
  "conditionColourFamily": "blue (optional, family enum or null)",
  "action": "prefer (required, action enum)",
  "weight": "number 0 to 100, optional, default 50",
  "reason": "Size for wide shoulders and large traps first. (required, 1 to 500 chars)",
  "source": "User stated fit preference (required, 1 to 200 chars)",
  "sourceText": "optional pasted advice text for reference, or null",
  "enabled": true
}
```

Response 201: advice rule object with all fields plus `id`, `userId`, and timestamps. Errors: 400, 403 is not applicable on create (the rule is created for the authenticated user).

### POST /api/advice-rules/seed

No body required. If the user already has any advice rules, returns the existing rules with 200 and `seeded: false`. Otherwise creates the 10 spec section 6.5 starting rules and returns them with 201 and `seeded: true`. Response shape: `{ "seeded": true, "data": [ ...rules ] }`. This endpoint is idempotent by design: calling it twice never duplicates the starting set.

### GET /api/advice-rules

List envelope. Query: `enabled` (true or false), `page`, `pageSize`. Sort: `name` or `recent`.

### GET, PATCH, DELETE /api/advice-rules/:id

PATCH body: any advice rule field except `id` and `userId`, all optional, same validation. DELETE response: `{ "deleted": true, "id": "uuid" }`. Errors: 400, 403, 404.

## Data export

### POST /api/export

No body required. Auth required. Response: a ZIP file with content type `application/zip` and a `Content-Disposition` attachment filename of the form `closet-export-<date>.zip`. Contents:

- `export.json`: export metadata (exportedAt, userId, counts).
- `profile.json`: the user profile.
- `palettes.json`: palettes with colours and avoid rules.
- `items.json`: items with colours, scores, wear counts, and storage paths.
- `advice-rules.json`: advice rules.
- `outfits.json`: outfits with outfit items.
- `wear-logs.json`: wear logs with item snapshots.
- `photos/<storage path>`: stored photo bytes, when the storage provider holds them (memory provider in local mode, Supabase Storage in production). When a photo cannot be fetched, the JSON still lists its storage path and the export does not fail.

No paid service is required. Errors: 401 when unauthenticated.

## Versioning and compatibility

- This is DRAFT v0, not v1. When Agent D freezes it, the freeze is recorded in `docs/merges.md` with a version number, and later changes follow the breaking change rule at the top of this document.
- Additive changes (new optional fields, new endpoints) do not break existing clients. Renames, removals, and enum value changes are breaking and need Agent D approval.

## Decisions and open items for Agent D

1. JSON uses camelCase, database columns use snake_case. The API translates. This is a backend decision, recorded here so Agent A does not have to guess.
2. Wrapped hue ranges are not supported in MVP avoid rules. Use two rules for a wrapping range.
3. Wear log delete does not recompute `lastWornAt` from remaining logs. It decrements counts only. Recomputing is a later improvement.
4. Palette re-rate is synchronous in MVP. Background progress is a frontend indicator, not a separate API job in MVP.
5. The auth callback is a Supabase Auth redirect flow, not a bearer authenticated data endpoint. There is no unauthenticated data route.
6. Item category is a free string in MVP, not a closed enum, because the spec does not fix a category list. The builder special cases `hoodie` and `graphic tee` for Interview outfits.
7. Cost per wear is derived (`price / wearCount`), never stored directly.
8. The local dev server signed URL route (`GET /api/storage/:path`) is local only. Production signed URLs come from Supabase Storage.
