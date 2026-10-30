# PR: feat/ISSUE-17-outfit-builder

- Issue closed: ISSUE-17 (Outfit Builder home screen)
- Branch: feat/ISSUE-17-outfit-builder
- Based on: feat/ISSUE-16-outfit-engine. Merge order position: 8 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Replaced the ISSUE-20 home placeholder with the Outfit Builder at app/page.tsx, the first screen after login: occasion, season, and vibe selectors, Build button, 3 outfits with photos (thumbnails from the items list), scores with a breakdown (palette, fit, contrast, rotation), and a why it works list built from the rules that fired.
- Actions per outfit: Save (creates the outfit through the frozen API with items by slot, scores, and explanation, saved true), Log worn (saves first if needed, then creates a wear log, which increments wear counts on the server), Shuffle slot (replaces only that slot with the highest scoring alternative in rotation, recomputing scores through the engine), and Dislike (stores the exact combination in browser local storage and removes it from the current results).
- Build runs through the Web Worker (lib/outfit-engine/worker.ts) with a 10 second timeout fallback to a direct engine call, so a worker failure does not block building. The engine itself is the ISSUE-16 pruned beam search, so interview rules (only Perfect and Strong, no hoodies or graphic tees, white or light neutral collared shirt preferred) and formal rules (one saturated accent) are enforced by the engine, not duplicated in the UI.
- Empty slots are shown as Missing with the note that nothing was invented. Offline generation works from the last loaded wardrobe cache; if no wardrobe is cached, the UI says to connect once to load it.
- Added lib/dislikes.ts (loadDislikes, saveDislike, closet_dislikes key). A helper exported from a page file is not a valid Next.js page export, so the dislike helpers live in lib, not in app/page.tsx.

## How to test

- Sign in, add in rotation items covering base top, outer, bottom, shoes, and accessory, then open / and build a daily outfit, an interview outfit, and a formal outfit. Check interview outfits contain only Perfect and Strong items, no hoodies or graphic tees, and prefer a white or light neutral collared shirt if one exists.
- Save an outfit, log it as worn, shuffle one slot and check only that slot changes, dislike a combination and rebuild, and check the exact combination does not return within 30 days.
- Run sh scripts/check-tests.sh and npm run build.

## Test results

- npm run build: passed after moving dislike helpers out of the page file. Compiled successfully, including the Web Worker.
- sh scripts/check-tests.sh (non-live): total 135, pass 121, fail 0, skipped 14. No gated test covers the builder UI directly, so no count change was expected here.

## Contract change

No contract change.

## Mismatch or blocked items

- Dislikes have no frozen API endpoint (see the ISSUE-16 PR file). They are stored in browser local storage, so they do not sync across devices. This is reported to Agent D as a contract gap, not changed here. If Agent D approves a dislike endpoint, the builder should switch to it without changing the engine.
- No em dashes. No secrets committed.
