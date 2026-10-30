# PR: feat/ISSUE-09-background-removal

- Issue closed: ISSUE-09 (Browser background removal confirm flow and colour clustering)
- Branch: feat/ISSUE-09-background-removal
- Based on: feat/ISSUE-04-palette-correction. Merge order position: 4 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Added lib/colour-cluster.js with backgroundMask (border colour in Lab space, garment mask, null when under 2 percent garment pixels remain, which the UI treats as failure), clusterColours (deterministic k-means, k equals 4, Lab space, no random seed), and dominantColours (up to 3 colours, clusters under 5 percent discarded unless a clear accent: Lab distance over 25 from the primary and saturation at least 40). Clustering uses garment pixels only.
- Added lib/colour-cluster.d.ts and lib/image-compress.ts (WebP, max 1200 pixels longest edge, 400 pixel thumbnail, per spec 9.1).
- Added components/BackgroundRemoval.tsx: shows the original and the cutout, dominant colours with percentages, Confirm cutout, Retake photo, and, when removal fails, Save manually. A manual save is marked manual, not auto rated, in the item page that consumes it on the ISSUE-11 branch.
- Fixed a bug found by a synthetic probe during this branch: the k-means centre object reused the key b for Lab b and for the blue channel, overwriting Lab b. Centres now store Lab separately from RGB, and the probe now gives Navy Lab (-24.29 b) instead of the blue channel value.

## How to test

- From Node, probe lib/colour-cluster.js with a synthetic pixel set (70 percent navy, 25 percent light gray, 4 percent saturated red, 1 percent noise): dominantColours returns navy 70.7 percent primary, light gray 25.3 percent, and the 4 percent red accent kept as a clear accent, with correct Lab values.
- In the browser, the BackgroundRemoval component is consumed by the item add page on the ISSUE-11 branch. On this branch alone, run npm run build and sh scripts/check-tests.sh to confirm no regression.
- Run sh scripts/check-tests.sh and npm run build.

## Test results

- Synthetic Node probe: passed after the centre bug fix (see above).
- npm run build: passed. Compiled successfully.
- sh scripts/check-tests.sh (non-live): total 135, pass 116, fail 0, skipped 19. No gated test covers background removal directly, so no count change was expected here.

## Contract change

No contract change.

## Mismatch or blocked items

- Background removal is a local corner colour method for plain backgrounds, not the @imgly package named as an example in spec 9.2. The spec names @imgly as an example, not a requirement, and the manual fallback is the spec required behaviour when removal fails. A model based removal library would be larger and is not bundled in MVP. This is a documented implementation choice, not a contract change. If Agent D wants @imgly, that is a follow up decision, not a silent substitution.
- No em dashes in new code (the phrase "em dashes" in comments refers to the rule, it is not an em dash character). No secrets committed.
