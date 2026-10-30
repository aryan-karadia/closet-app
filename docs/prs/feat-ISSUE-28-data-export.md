# PR: feat/ISSUE-28-data-export

- Issue closed: ISSUE-28 (Data export ZIP)
- Branch: feat/ISSUE-28-data-export
- Based on: feat/ISSUE-15-advice-rules. Merge order position: 15 of 16, after ISSUE-15 and before ISSUE-05. Agent D must merge in the order listed in the final backend report.
- Dependency chain: ISSUE-23, ISSUE-24, ISSUE-25, ISSUE-26, ISSUE-21, ISSUE-01, ISSUE-02, ISSUE-10, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-13, ISSUE-14, ISSUE-15, then this branch, then ISSUE-05.

## What changed

- Added `lib/api/export.js`: POST `/api/export` returns a ZIP file (`application/zip`, attachment filename `closet-export-<date>.zip`) with no paid service and no extra dependency. The ZIP is built with stored (uncompressed) entries and a CRC32, using only Node builtins.
- Contents: `export.json` (exportedAt, userId, counts, and a photos note when applicable), `profile.json`, `palettes.json` (palettes with colours and avoid rules), `items.json` (items with colours, scores, wear counts, derived cost per wear, and storage paths), `advice-rules.json`, `outfits.json` (outfits with outfit items), `wear-logs.json` (wear logs with item snapshots), and `photos/<storage path>` for stored photo bytes when the storage provider holds them.
- In local mode (memory provider), photos are included from the provider. In production with Supabase Storage, the provider does not expose a local file read, so photos are not downloaded into the ZIP by this branch; the JSON still lists every storage path, and `export.json` records that note. Downloading Supabase photos into the export is a follow up for Agent D to prioritise, not a silent gap: it is stated here and in the export metadata.
- Registered the export route in `lib/api/router.js`. The dev server and Next.js adapter already handled zip results (content type and attachment header) from the ISSUE-21 branch.
- Contract change: No contract change. This branch implements the data export section of the ISSUE-23 contract.

## How to test

- Start the dev server: `CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js`
- With header `Authorization: Bearer test:user-1`: create an item and an outfit, then `curl -X POST -H "Authorization: Bearer test:user-1" http://localhost:3101/api/export -o export.zip` and check the response is a ZIP (unzip -l shows export.json, profile.json, palettes.json, items.json, advice-rules.json, outfits.json, wear-logs.json) and that the JSON inside parses.
- Check errors: no token is 401.
- Run: `sh scripts/check-tests.sh` from the repo root.

## Test results

- Agent C suite on this branch: total 98, pass 85, fail 0, skipped 13. Matches the previous branch. No impl-gated test covers export directly, so no gated test was expected to turn green here.
- Manual dev server checks during development: export ZIP creation, unzip listing, and JSON parsing of items.json inside the ZIP were verified with curl and unzip. Those checks were ad hoc, not committed tests.

## Mismatch or blocked items

- Supabase photo download into the export is outstanding, as described above. Local mode photos are included. This is a known limitation, not a contract change.
- No secrets added. No em dashes added (checked by grep before commit).
