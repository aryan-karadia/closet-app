# PR: feat/ISSUE-27-pwa-offline

- Issue closed: ISSUE-27 (PWA manifest, install, and offline wardrobe view)
- Branch: feat/ISSUE-27-pwa-offline
- Based on: feat/ISSUE-22-settings. Merge order position: 12 of 12, final branch. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Added public/manifest.webmanifest (name Closet, short name Closet, start_url /, display standalone, theme and background colours, 192 and 512 PNG icons) and linked it from app/layout.tsx, with a theme colour meta tag and an Apple touch icon link. Icons are simple generated PNGs in public/icons/.
- Added public/sw.js: service worker that caches the app shell and icons on install, uses network first with a cache fallback for API GET requests, and cache first with a network fallback for other GET requests, so previously loaded wardrobe and saved outfit lists still show offline.
- Added components/PwaInstall.tsx: registers the service worker, captures beforeinstallprompt, shows an Install button when the browser offers it, and otherwise explains Add to Home screen on Android. It is shown on the Settings page.
- Offline viewing was already prepared on earlier branches: the wardrobe grid caches its last loaded list in local storage, saved outfits cache theirs, and the builder falls back to the wardrobe cache. The PWA component and the builder both state the limitation clearly: offline outfit generation is supported only from the last loaded wardrobe; if no wardrobe is cached, connect once to load it.
- No Play Store publishing in MVP, as required.

## How to test

- Run npm run build, then npm run start (or npm run dev), open the app in Chrome, and check the manifest loads at /manifest.webmanifest and the service worker registers at /sw.js.
- On Android Chrome, check the install prompt or Add to Home screen option appears, install the app, load the wardrobe and saved outfits once, turn off network, and reopen them: the cached lists show with an offline notice.
- Run sh scripts/check-tests.sh, and live against a local dev server with CLOSET_TEST_BASE_URL=http://localhost:3101.

## Test results

- npm run build: passed. Compiled successfully.
- sh scripts/check-tests.sh (non-live): total 135, pass 121, fail 0, skipped 14 (live API and auth tests only).
- Live against a local dev server (CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js, CLOSET_TEST_BASE_URL=http://localhost:3101): total 135, pass 135, fail 0, skipped 0. This is the first live run with zero skipped tests, because the outfit engine (5) and palette ingester (3) gated tests now pass in both modes, and all 14 live API tests pass.
- Real Android device install and offline behaviour were not tested in this environment (no Android device here). That is a device verification item for Agent D or the user, not a code claim.

## Contract change

No contract change.

## Mismatch or blocked items

- None for the contract. The same two blocked items from ISSUE-22 remain open for Agent D: no account delete endpoint, and no storage usage endpoint in the frozen contract.
- No em dashes. No secrets committed.
