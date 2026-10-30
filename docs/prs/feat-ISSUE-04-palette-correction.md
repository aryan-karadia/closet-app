# PR: feat/ISSUE-04-palette-correction

- Issue closed: ISSUE-04 (Palette correction screen)
- Branch: feat/ISSUE-04-palette-correction
- Based on: feat/ISSUE-03-palette-ingester. Merge order position: 3 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Replaced the ISSUE-03 placeholder at app/palette/correct/page.tsx with the full correction screen: load a draft from session storage (from the ISSUE-03 upload page) or an existing palette via ?paletteId=, rename, change role, change hex with a colour picker and a text hex field, delete, add colours manually, Remove beauty colours with an Undo restore, and a summary with core, neutral, and avoid counts plus warnings when zero neutrals or zero avoids.
- Nothing is final until the user approves and saves. Save creates a palette through the frozen API, creates its colours, creates avoid rules for avoid rule drafts using the contract starting ranges (warm oranges 20 to 50 hue, 41 to 100 saturation, 30 to 70 lightness; light pastels 0 to 360 hue, 0 to 44 saturation, 76 to 100 lightness; muted earthy hues 20 to 90 hue, 10 to 45 saturation, 25 to 65 lightness), optionally activates it, and calls the frozen rerate endpoint, showing rerated, skipped, and total counts.
- Starting hex values for spec section 15 colours are prefilled when the PDF text gave no hex, so the user can correct rather than invent every shade. The user can still change any hex before saving.
- Small fix in lib/api-client.ts: createPaletteColour now takes a record body, fixing a TypeScript family enum mismatch from the correction page. No contract change.

## How to test

- Sign in, open /palette, upload a palette PDF, continue to correction, rename a colour, change a role and a hex, delete one, add one manually, use Remove beauty colours then Undo, and check the summary counts and warnings.
- Approve and save, then check on /palette that the new palette exists, and that its colours and avoid rules were created through the API (open the palette detail via the API or the correction page with ?paletteId=).
- Run sh scripts/check-tests.sh and npm run build.

## Test results

- sh scripts/check-tests.sh (non-live): total 135, pass 116, fail 0, skipped 19. Same as the ISSUE-03 branch. The palette ingester gated tests (3) already pass; no new gated test covers the correction UI itself, so no count change was expected here.
- npm run build: passed after the api-client type fix. Compiled successfully.

## Contract change

No contract change.

## Mismatch or blocked items

- None for the contract. The correction screen needs a hex for every saved colour because the frozen API requires hex on palette colour create; text only named colours without a hex are therefore not saved as colours, and the UI blocks save and names the colours that still need a hex. This matches the contract, and is noted here so Agent D does not mistake it for a missing feature.
- No em dashes. No secrets committed.
