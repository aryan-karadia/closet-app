# PR: fix/ISSUE-23-openapi-alignment

## Issue closed

ISSUE-23, OpenAPI alignment: update docs/openapi.yaml only, to match
docs/api-contract.md exactly, for the 9 disagreements listed in the
Agent C PR file for test/ISSUE-30-contract-update and in
tests/TEST-PLAN.md Blocked item 4. The contract doc wins in every
case. This branch does not freeze the contract and it is not merged
to main by Agent B.

## Dependency chain and merge order

This branch is second in the chain. It is based on
fix/ISSUE-13-duplicate-outfit-item, not directly on main.

1. fix/ISSUE-13-duplicate-outfit-item (ISSUE-13 fix, merge first)
2. fix/ISSUE-23-openapi-alignment (this branch, ISSUE-23 fix,
   merge second)

Agent D merges in that order. Merging this branch without the first
would lose the ISSUE-13 fix, because this branch contains it as its
base.

## What changed

Only docs/openapi.yaml, plus this PR file. No implementation file
was changed in this branch, and no test file was edited. The local
implementation already follows the contract doc on the list shape
point (item 4 below), verified by Agent C live probe, so the
implementation was left alone and only OpenAPI was changed.

1. GET /api/storage/:path: added a path entry as
   /api/storage/{path} with a path parameter, a required token
   query parameter, a 200 image/webp binary response, and 401,
   404, and 405 responses. Marked local dev server only, with
   production signed URLs pointing at Supabase Storage, matching
   the contract doc.
2. 405 METHOD_NOT_ALLOWED: added a shared
   components/responses/MethodNotAllowed response using the
   standard Error schema, and referenced it as a 405 response on
   every operation (51 operations, verified by parsing the YAML).
   The Error schema already listed METHOD_NOT_ALLOWED in its code
   enum; it now has a response to go with it.
3. List query params: added palettes isActive (boolean) and sort
   (recent, name); palette colours pagination (Page, PageSize)
   and sort (name, recent); avoid rules pagination and sort
   (name, recent); item colours pagination; and outfit items
   pagination. All values match the contract doc sections for
   those lists.
4. List schemas: added PaletteListItem (Palette without colours
   and avoidRules), ItemListItem (Item without colours), and
   OutfitListItem (Outfit without items). PaletteList, ItemList,
   and OutfitList now use those schemas for their data arrays.
   Single resource schemas (Palette, Item, Outfit) are unchanged
   and still carry the embedded children.
5. Upload maxima: UploadCreate width now has maximum 1200 with a
   description stating the image maximum is 1200 and the
   thumbnail maximum is 400, and a wider value is 400. Height
   now has maximum 4000. dataBase64 now has a description
   stating the maximum decoded size accepted is 5MB and larger
   uploads are 400.
6. Pagination clamping: the shared Page and PageSize parameters
   no longer carry minimum and maximum bounds that read as
   rejection. Their descriptions now state the ranges (page
   starts at 1; pageSize 1 to 100, default 20), that out of
   range values are clamped, not rejected, and that non numeric
   values are 400 VALIDATION_ERROR, matching the contract doc.
7. Outfit item delete: added an OutfitItemDeleted schema with
   exactly { deleted, outfitId, itemId }, and the DELETE
   /api/outfits/{outfitId}/items/{itemId} operation now uses
   it. The generic Deleted schema is unchanged and still used
   by the other delete endpoints, where id is correct.
8. Export filename: the POST /api/export 200 response now states
   that the Content-Disposition attachment filename follows
   the pattern closet-export-<date>.zip, and declares a
   Content-Disposition header with that description and an
   example filename.
9. PaletteColour labL range: PaletteColourCreate labL now has
   minimum 0 and maximum 100, matching the contract doc. Only
   the create schema was changed for this item, as listed.

The YAML was verified by parsing it: 29 paths (28 before, plus
the storage path), 51 operations with a 405 response, list
schemas pointing at the new list item schemas, and the list
item schemas carrying no excluded embedded children.

## How to test

From the repo root, no dependencies to install:

```
sh scripts/check-tests.sh
```

For the live check, in one terminal start the local dev server, then
in another run the same check with the base URL set:

```
CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js
CLOSET_TEST_BASE_URL=http://localhost:3101 sh scripts/check-tests.sh
```

To check the OpenAPI file itself, parse it (for example with
Python PyYAML) and confirm the storage path exists, every
operation has a 405 response, PaletteList uses
PaletteListItem, ItemList uses ItemListItem, OutfitList uses
OutfitListItem, UploadCreate width and height carry the maxima
above, PaletteColourCreate labL carries 0 to 100, and the
outfit item delete operation uses OutfitItemDeleted.

No live Supabase project was tested. No live project exists. No
real credentials are used anywhere. Placeholders and local test
tokens only (Bearer test:<user-id> in local mode).

## Test results

Without CLOSET_TEST_BASE_URL: total 135, pass 113, fail 0,
skipped 22 (outfit engine 5, palette ingester 3, live API and
auth 14). This matches the Agent D verified baseline on main
and the ISSUE-13 branch result, as expected, because this
branch changes only docs/openapi.yaml.

Live against a local dev server
(CLOSET_TEST_BASE_URL=http://localhost:3101, server started with
CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js):
total 135, pass 127, fail 0, skipped 8 (outfit engine 5, palette
ingester 3). This includes the ISSUE-13 fix from the base
branch.

Duplicate item case, called out explicitly (from the base
branch, re-verified by the live run on this branch): the live
test "impl api: outfit CRUD, duplicate slot, outfit items, and
missing item distinction" in
tests/impl-gated/api-and-auth.test.js passes on this branch.
It adds an item already in the outfit in a free slot and
expects 400 VALIDATION_ERROR. The manual probe on the ISSUE-13
branch also returned 400 with details { items: "Duplicate item
in one outfit." } and left the item in its original slot.

## Contract change

No contract change by Agent B. This is the statement required
for this fix: OpenAPI is being aligned to the existing contract
doc, not changing the contract. docs/api-contract.md was not
changed in this branch. No factual error in the contract doc
was found while making these 9 changes, so no contract
correction is reported to Agent D. Agent D freezes the
contract, not Agent B.

## Mismatch or blocked items

None for this issue. All 9 listed disagreements are addressed
above. The implementation was not changed to match OpenAPI on
item 4, because the contract doc wins and the implementation
already follows the contract doc.

Remaining skipped tests are unchanged and are not this issue:
outfit engine 5 (Agent A, ISSUE-16), palette ingester 3 (Agent A,
ISSUE-03 and ISSUE-04), live API and auth 14 without
CLOSET_TEST_BASE_URL. No live Supabase project exists, so
Supabase backed behaviour is untested (ISSUE-31 covers the live
Supabase gate).

## No secrets, no em dashes

No real credentials, API keys, or passwords are in this branch.
Placeholders and local test tokens only. No em dashes are used
in this branch.
