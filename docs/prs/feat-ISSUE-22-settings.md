# PR: feat/ISSUE-22-settings

- Issue closed: ISSUE-22 (Settings and profile edit)
- Branch: feat/ISSUE-22-settings
- Based on: feat/ISSUE-19-saved-outfits. Merge order position: 11 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Added app/settings/page.tsx: profile edit (display name, fit tags, style direction, active palette) through the frozen profile API, palette management link to /palette, data export button through the frozen export endpoint (downloads a ZIP), sign out, and a storage usage estimate with a warning at 80 percent.
- Delete account uses a two step confirmation, as the spec requires for destructive actions. See the blocked item below for why it does not complete a deletion.

## How to test

- Sign in, open /settings, edit display name, fit tags, and style direction, save, and reload to check they persist. Change the active palette and check rating uses it.
- Use Export data and check a ZIP downloads. Check the storage estimate updates with the number of items with photos, and that the 80 percent warning logic is present (it will not trigger at single user scale, which is expected).
- Open Delete account, confirm, and check the blocked message (see below). Cancel and check nothing changes.

## Test results

- npm run build: passed. Compiled successfully.
- sh scripts/check-tests.sh (non-live): total 135, pass 121, fail 0, skipped 14. No gated test covers settings directly, so no count change was expected here.

## Contract change

No contract change.

## Mismatch or blocked items

- BLOCKED, reported to Agent D: the frozen contract has no account delete endpoint. No endpoint was invented. The settings delete flow confirms, then states clearly that deletion is blocked pending Agent D routing to Agent B, and that no data was deleted. Agent D should route an account delete endpoint (or a documented decision that deletion is out of MVP) through Agent B and Agent C.
- Storage usage: the frozen contract has no storage usage endpoint either, so the settings page estimates usage from items with photos at about 200KB each against the 1GB free tier limit, and says so on the page. A real Supabase storage usage value would need a contract addition through Agent D.
- No em dashes. No secrets committed.
