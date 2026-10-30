# PR: feat/ISSUE-11-item-ui

- Issue closed: ISSUE-11 (Item add, edit, and detail UI with score badge)
- Branch: feat/ISSUE-11-item-ui
- Based on: feat/ISSUE-09-background-removal. Merge order position: 5 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Added app/items/new/page.tsx: photo upload, BackgroundRemoval confirm or retake flow from ISSUE-09, item form (name, category, season, fit tags, status, price), dominant colours sent to the frozen item create endpoint so the server rates against the active palette, then compressed WebP image and thumbnail uploads through the frozen uploads endpoint, then photo paths patched onto the item. Manual saves create an item with no colours and a rating reason stating it is manual, not auto rated.
- Added app/items/[id]/page.tsx: detail with photo (signed URL from the API), ScoreBadge (number plus verdict text, colour blind friendly), dominant colours with percentages, nearest palette colour, reason, auto score, manual override with note, fit tags, wear count, last worn, cost per wear, price, outfits using the item, Edit, soft delete with confirmation, restore within 30 days, and permanent delete.
- Added app/items/[id]/edit/page.tsx: correct any auto field, change status, set or clear a manual score override with a note. Clearing restores the auto score as the effective score, per the contract. The auto score is never overwritten silently.
- Added app/wardrobe/page.tsx as a placeholder only; the full grid lands on the ISSUE-12 branch.
- Small fix in lib/api-client.ts: listOutfits params now accept numbers (pageSize), fixing a build type error.

## How to test

- Sign in, open /items/new, upload a photo of one item against a plain wall, confirm the cutout, fill in name, category, season, and tags, and save. Check the detail page shows the score badge, dominant colours, nearest palette colour, and reason.
- Edit the item, set a manual score with a note, and check the detail page shows the override separately from the auto score. Clear the override and save, and check the auto score returns as the effective score.
- Soft delete the item, restore it within 30 days from the detail page, and check it returns to the wardrobe. Permanent delete only after soft delete, per the contract.
- Run sh scripts/check-tests.sh and npm run build.

## Test results

- npm run build: passed after the api-client type fix. Compiled successfully.
- sh scripts/check-tests.sh (non-live): total 135, pass 116, fail 0, skipped 19. No gated test covers item UI directly, so no count change was expected here.
- Live end to end item flow against a local dev server was not run on this branch alone; it is covered in the final branch live run, where item create, upload, and detail are exercised through the API.

## Contract change

No contract change.

## Mismatch or blocked items

- None for the contract. Note: the detail page lists outfits using an item by fetching outfits (pageSize 100) and filtering client side, because the frozen contract has no items to outfits reverse endpoint. This is a UI workaround, not a new endpoint.
- No em dashes. No secrets committed.
