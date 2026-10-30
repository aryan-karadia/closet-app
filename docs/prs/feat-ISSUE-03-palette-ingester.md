# PR: feat/ISSUE-03-palette-ingester

- Issue closed: ISSUE-03 (PDF text extraction and beauty section filter, browser)
- Branch: feat/ISSUE-03-palette-ingester
- Based on: feat/ISSUE-20-google-auth. Merge order position: 2 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Added lib/palette-ingester.js (the exact path tests/impl-gated/palette-ingester.test.js requires) with classifySection, classifyPage, extractFromPages, isBeautyColour, removeBeautyColours, summarizeColours, and correction helpers. Beauty keywords are makeup, blush, lip, hair, nail, Facetune, and related terms. Beauty sections classify as ignore and beauty flagged entries are never saved as clothing colours unless the user explicitly adds them. Known colours come from spec section 15. Avoid phrases (light pastels, warm oranges, muted earthy hues) are extracted as avoid rule drafts, not colours. Source page is kept for every entry. A short name covered by a longer name on the same line (Black inside Cool Black) is not duplicated.
- Added lib/palette-ingester.d.ts for TypeScript use.
- Added app/palette/page.tsx: palette list with activate, PDF upload, browser pdf.js text extraction per page (worker served from public/pdf.worker.min.mjs, copied from pdfjs-dist), extracted list with beauty flags, draft stored in session storage for the correction screen.
- Added app/palette/correct/page.tsx as a placeholder only; the full correction screen lands on the ISSUE-04 branch.
- Added public/pdf.worker.min.mjs (pdf.js worker, 1.3 MB, from the installed pdfjs-dist package).

## How to test

- Sign in, open /palette, upload a text based palette PDF, and check the extracted list shows core, neutral, and avoid entries with page numbers, and beauty entries flagged as ignored.
- From Node, run a small probe of lib/palette-ingester.js with a Deep Winter page and a makeup page: core and neutral entries extract, beauty entries are flagged, summarizeColours counts them, and removeBeautyColours separates them with an undoable removed list.
- Run sh scripts/check-tests.sh from the repo root. Run npm run build.

## Test results

- sh scripts/check-tests.sh (non-live): total 135, pass 116, fail 0, skipped 19. Palette ingester gated tests (3) now pass, up from the 113 pass baseline. Remaining skipped: outfit engine 5, live API and auth 14.
- npm run build: passed after removing an unused ts-expect-error directive in the palette page. Compiled successfully.
- Manual Node probe: Deep Winter page extracted Royal Blue and Emerald Green as core, Navy and Cool Black as neutral, light pastels and warm oranges as avoid rule drafts; a makeup page produced no clothing colours.

## Contract change

No contract change.

## Mismatch or blocked items

- Gated palette tests are interface skeletons (they assert the module exists). They do not assert full extraction behaviour, so Agent C should tighten them through Agent D with real PDF inputs before treating ISSUE-03 as fully proven. This is reported, not hidden, and no test was edited.
- Swatch sampling from rendered PDF pages (spec 4.3 step 2) and the manual tap picker fallback are not in this branch: extraction here is text based, and hex values are left for the user to set on the correction screen. The correction screen requires a hex for every saved colour because the frozen API requires hex on palette colour create. This is a documented partial scope item for Agent D, not a silent omission.
- No em dashes. No secrets committed.
