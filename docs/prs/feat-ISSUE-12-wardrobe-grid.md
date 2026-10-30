# PR: feat/ISSUE-12-wardrobe-grid

- Issue closed: ISSUE-12 (Wardrobe grid filters, sort, and search)
- Branch: feat/ISSUE-12-wardrobe-grid
- Based on: feat/ISSUE-11-item-ui. Merge order position: 6 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Replaced the ISSUE-11 wardrobe placeholder with the full grid at app/wardrobe/page.tsx: photo thumbnail (lazy loaded), category, score badge with number plus verdict, season, fit tags, and wear count on each card, linking to the item detail page.
- Filters use the frozen items list API: category, palette verdict, season, fit tag, status, colour family, and search by name or tag. Sort uses the contract sort values: paletteScore (highest first), wearCount (least worn first), recent (recently added), and name.
- The last loaded list is cached in local storage under closet_wardrobe_cache, so the grid can be shown offline with a clear offline notice. Full PWA offline support lands on the ISSUE-27 branch.

## How to test

- Sign in, add a few items with different categories, seasons, and verdicts, then open /wardrobe and apply each filter and each sort, and check the grid updates. Search by a name fragment and by a fit tag.
- Turn off network after a first load and reload /wardrobe: the cached grid shows with an offline notice.
- Run sh scripts/check-tests.sh and npm run build.

## Test results

- npm run build: passed after fixing a Next.js page export error (a cache key constant exported from a page file is not a valid page export, so it is now a local constant). Compiled successfully.
- sh scripts/check-tests.sh (non-live): total 135, pass 116, fail 0, skipped 19. No gated test covers the wardrobe UI directly, so no count change was expected here.

## Contract change

No contract change.

## Mismatch or blocked items

- None. The colour family filter excludes items without colours on the server, per the contract; the UI does not hide that behaviour.
- No em dashes. No secrets committed.
