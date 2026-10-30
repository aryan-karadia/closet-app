# PR: feat/ISSUE-19-saved-outfits

- Issue closed: ISSUE-19 (Saved Outfits screen)
- Branch: feat/ISSUE-19-saved-outfits
- Based on: feat/ISSUE-18-advice-rules-ui. Merge order position: 10 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Replaced the ISSUE-18 saved outfits placeholder with the full screen at app/outfits/page.tsx: list saved outfits (saved true filter) with occasion, date saved, season, vibe, and total score badge, Log worn action, and Delete. Saved outfits are cached in local storage for offline viewing.
- Added a Wear this interview outfit shortcut card at the top when a saved interview outfit exists, with a Log worn today action and a link to the outfit detail.
- Added app/outfits/[id]/page.tsx: outfit detail with items by slot, photos loaded per item when a signed thumbnail is available, scores, explanation, Log worn, and Delete.

## How to test

- Sign in, build and save outfits on /, including an interview outfit, then open /outfits and check the list shows occasion and date saved, the interview shortcut appears, Log worn creates a wear log and updates wear counts, and Delete removes the outfit.
- Open an outfit detail and check items, scores, and explanation.
- Run sh scripts/check-tests.sh and npm run build.

## Test results

- npm run build: passed. Compiled successfully.
- sh scripts/check-tests.sh (non-live): total 135, pass 121, fail 0, skipped 14. No gated test covers the saved outfits UI directly, so no count change was expected here.

## Contract change

No contract change.

## Mismatch or blocked items

- None. Note: outfit items from the API carry itemName but no photo, so the detail page loads each item separately for a thumbnail. This is a UI workaround, not a new endpoint.
- No em dashes. No secrets committed.
