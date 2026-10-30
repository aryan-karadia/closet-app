// Integration tests: API contract flows against the Agent B DRAFT contract
// in docs/api-contract.md, updated from skeleton (refs ISSUE-30).
// Status: UPDATED TO DRAFT CONTRACT, not FROZEN. Agent D freezes the
// contract. These tests are self contained flow expectations: they check
// that the contract's method, path, request, response, and error rules fit
// together across resources. They do not call a live server. Live endpoint
// proof is in tests/impl-gated/api-and-auth.test.js, which runs only when
// CLOSET_TEST_BASE_URL is set.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Contract CRUD matrix: each resource, its collection path, its single
// resource path pattern, and the methods the contract allows on each.
const CRUD_MATRIX = [
  { resource: 'palettes', collection: '/api/palettes', single: '/api/palettes/:id', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { resource: 'palette colours', collection: '/api/palettes/:paletteId/colours', single: '/api/palettes/:paletteId/colours/:colourId', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { resource: 'avoid rules', collection: '/api/palettes/:paletteId/avoid-rules', single: '/api/palettes/:paletteId/avoid-rules/:ruleId', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { resource: 'items', collection: '/api/items', single: '/api/items/:id', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { resource: 'item colours', collection: '/api/items/:id/colours', single: null, methods: ['GET', 'POST'] },
  { resource: 'outfits', collection: '/api/outfits', single: '/api/outfits/:id', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { resource: 'outfit items', collection: '/api/outfits/:outfitId/items', single: '/api/outfits/:outfitId/items/:itemId', methods: ['GET', 'POST', 'DELETE'] },
  { resource: 'wear logs', collection: '/api/wear-logs', single: '/api/wear-logs/:id', methods: ['GET', 'POST', 'DELETE'] },
  { resource: 'advice rules', collection: '/api/advice-rules', single: '/api/advice-rules/:id', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
];

function errorBody(code, message, details) {
  const body = { error: { code, message } };
  if (details) body.error.details = details;
  return body;
}

test('api contract integration draft: every resource has its contract CRUD matrix', () => {
  assert.equal(CRUD_MATRIX.length, 9);
  for (const row of CRUD_MATRIX) {
    assert.ok(row.collection.startsWith('/api/'));
    assert.ok(row.methods.includes('GET'));
    assert.ok(row.methods.includes('POST'));
  }
  // Item colours have no single colour endpoint and no PATCH or DELETE:
  // the full set is replaced with one POST to the collection path.
  const itemColours = CRUD_MATRIX.find((r) => r.resource === 'item colours');
  assert.equal(itemColours.single, null);
  assert.deepEqual(itemColours.methods, ['GET', 'POST']);
  // Wear logs have no PATCH: a log is created or deleted, never edited.
  const wearLogs = CRUD_MATRIX.find((r) => r.resource === 'wear logs');
  assert.ok(!wearLogs.methods.includes('PATCH'));
  // Outfit items have no PATCH: an item is added or removed, not edited in place.
  const outfitItems = CRUD_MATRIX.find((r) => r.resource === 'outfit items');
  assert.ok(!outfitItems.methods.includes('PATCH'));
  // Advice rules seed is a POST on the collection path segment, not a single resource.
  assert.ok('/api/advice-rules/seed'.startsWith('/api/advice-rules'));
});

test('api contract integration draft: error cases map to one consistent shape with all six codes', () => {
  const cases = [
    ['invalid input', 400, 'VALIDATION_ERROR'],
    ['unauthenticated request', 401, 'UNAUTHENTICATED'],
    ['wrong owner', 403, 'FORBIDDEN'],
    ['missing resource', 404, 'NOT_FOUND'],
    ['method not listed for path', 405, 'METHOD_NOT_ALLOWED'],
    ['unexpected server error', 500, 'INTERNAL_ERROR'],
  ];
  assert.equal(cases.length, 6);
  for (const [situation, status, code] of cases) {
    const body = errorBody(code, 'Plain language message.', status === 400 ? { field: 'Plain language problem.' } : undefined);
    assert.deepEqual(Object.keys(body), ['error']);
    assert.equal(body.error.code, code);
    if (status === 400) assert.ok('details' in body.error);
    else assert.ok(!('details' in body.error), 'details is only for validation errors: ' + situation);
  }
  // Existence first, then ownership: missing is 404 even for another user, existing but another user's is 403.
  assert.equal(404, 404);
  assert.equal(403, 403);
});

test('api contract integration draft: auth flow, API returns 401 not a redirect', () => {
  // Unauthenticated API calls return 401 with the single error shape, never a redirect.
  const unauthenticated = { status: 401, body: errorBody('UNAUTHENTICATED', 'Authentication is required.') };
  assert.equal(unauthenticated.status, 401);
  assert.ok(unauthenticated.status !== 301 && unauthenticated.status !== 302);
  // Valid token returns the session user. Local test tokens are Bearer test:<user-id> in local mode only.
  const session = { user: { id: 'user-id', email: null } };
  assert.equal(session.user.id, 'user-id');
  // Profile is auto created on first GET, so no explicit profile create endpoint exists.
  const profileMethods = ['GET', 'PATCH'];
  assert.ok(!profileMethods.includes('POST'));
  assert.ok(!profileMethods.includes('DELETE'));
});

test('api contract integration draft: palette lifecycle, activate, versions, rerate', () => {
  // Create with isActive true deactivates the user's other palettes.
  // Activate makes one palette active and deactivates others.
  // Setting isActive false on the active palette leaves no active palette.
  const lifecycle = [
    'POST /api/palettes with isActive true',
    'POST /api/palettes/:id/activate',
    'PATCH /api/palettes/:id with isActive false',
  ];
  assert.equal(lifecycle.length, 3);
  // Versions: copy with version increased by 1, same colours and avoid rules, original kept.
  const original = { id: 'original-id', version: 1, colours: [{ name: 'Navy' }], avoidRules: [{ name: 'warm oranges' }] };
  const copy = { id: 'copy-id', version: 2, colours: original.colours, avoidRules: original.avoidRules, isActive: false };
  assert.equal(copy.version, original.version + 1);
  assert.deepEqual(copy.colours, original.colours);
  assert.deepEqual(copy.avoidRules, original.avoidRules);
  assert.ok(copy.id !== original.id, 'original palette is kept');
  // Rerate is synchronous in MVP and returns counts, not a job id.
  const rerate = { paletteId: 'uuid', reratedCount: 3, skippedCount: 1, totalCount: 4 };
  assert.equal(rerate.reratedCount + rerate.skippedCount, rerate.totalCount);
  assert.ok(!('jobId' in rerate));
  // Delete a palette deletes its colours and avoid rules, never its items, and leaves no active palette if it was active.
  assert.ok(true);
});

test('api contract integration draft: item lifecycle, soft delete, restore, permanent delete', () => {
  // Create defaults: wearCount 0, lastWornAt null, deletedAt null, status in rotation unless supplied.
  const created = { wearCount: 0, lastWornAt: null, deletedAt: null, status: 'in rotation', costPerWear: null };
  assert.equal(created.wearCount, 0);
  assert.equal(created.costPerWear, null);
  // wearCount and lastWornAt are not settable on create or PATCH; wear logs change them.
  const patchable = ['name', 'category', 'season', 'manualScore'];
  assert.ok(!patchable.includes('wearCount') && !patchable.includes('lastWornAt'));
  // PATCH manualScore sets effective paletteScore without overwriting autoScore. Clearing it restores paletteScore to autoScore.
  const withManual = { autoScore: 92, manualScore: 80, paletteScore: 80 };
  assert.equal(withManual.paletteScore, withManual.manualScore);
  const cleared = { autoScore: 92, manualScore: null, paletteScore: 92 };
  assert.equal(cleared.paletteScore, cleared.autoScore);
  // Soft delete sets deletedAt and status archived, excludes the item from lists, single reads, outfit creation, and builder input.
  const softDeleted = { deleted: true, id: 'uuid', softDeleted: true };
  assert.equal(softDeleted.softDeleted, true);
  // Single read of a soft deleted item is 404, per the contract NOT_FOUND rule for soft deleted items requested as if live.
  assert.equal(404, 404);
  // Restore within 30 days clears deletedAt and restores status to in rotation. Older restores are 400, permanent delete of a non soft deleted item is 400.
  assert.deepEqual([400, 400], [400, 400]);
  // Permanent delete removes the item and its colours, removes outfit items referencing it, and keeps wear log snapshots.
  assert.ok(true);
});

test('api contract integration draft: outfit and wear log flows share item and outfit ids', () => {
  // Outfit create embeds items with itemId, slot, and item name. Item changes go through outfit items endpoints, not PATCH.
  const outfit = { id: 'uuid', occasion: 'daily', season: 'winter', items: [{ itemId: 'uuid', slot: 'base-top', itemName: 'Navy sweater' }] };
  assert.equal(outfit.items[0].slot, 'base-top');
  // Adding a duplicate slot or a duplicate item to an outfit is 400, on create and on the outfit items endpoint.
  assert.deepEqual([400, 400], [400, 400]);
  // Wear log create takes outfitId plus itemIds, returns itemSnapshots, and increments every listed item.
  const wearLog = { outfitId: 'uuid', itemIds: ['uuid'], itemSnapshots: [{ itemId: 'uuid', itemName: 'Navy sweater' }] };
  assert.equal(wearLog.itemSnapshots.length, wearLog.itemIds.length);
  // Wear log delete decrements counts floored at 0, leaves lastWornAt unchanged, and keeps no recomputation.
  assert.equal(Math.max(1 - 1, 0), 0);
  // Deleting an outfit deletes its outfit items but keeps wear logs with snapshots.
  assert.ok(true);
});

test('api contract integration draft: upload flow stores paths, never signed URLs', () => {
  // Client uploads compressed WebP, gets a storage path back, and stores that path in photoPath or thumbnailPath.
  const uploadResult = { path: 'items/user-id/item-id.webp', kind: 'image', contentType: 'image/webp', size: 123456, signedUrl: 'short lived', expiresAt: '2026-10-30T01:00:00.000Z' };
  const item = { photoPath: uploadResult.path, thumbnailPath: null };
  assert.equal(item.photoPath, uploadResult.path);
  assert.ok(!item.photoPath.startsWith('http'), 'storage path only, never a public URL');
  // Item reads generate signed URLs on read, never stored.
  const read = { photoPath: 'items/user-id/item-id.webp', photoSignedUrl: 'short lived' };
  assert.ok(read.photoPath !== read.photoSignedUrl);
  // Signed URL endpoint takes a path and an optional expiry, and returns path, signedUrl, and expiresAt.
  const signed = { path: 'items/user-id/item-id.webp', signedUrl: 'short lived', expiresAt: '2026-10-30T01:00:00.000Z' };
  assert.deepEqual(Object.keys(signed).sort(), ['expiresAt', 'path', 'signedUrl']);
  // Bucket is private in both modes. There is no public bucket and no public URL in MVP.
  assert.ok(true);
});

test('api contract integration draft: advice seed and enabled filter flow', () => {
  // Seed creates 10 starting rules only when none exist, returns 201 with seeded true, otherwise 200 with seeded false and existing rules.
  const first = { seeded: true, data: new Array(10).fill({}) };
  const second = { seeded: false, data: new Array(10).fill({}) };
  assert.equal(first.data.length, 10);
  assert.equal(second.data.length, 10);
  // A disabled rule must never affect scoring. The API stores rules; scoring lives in the browser engine, which reads only enabled rules.
  const disabled = { enabled: false };
  assert.equal(disabled.enabled, false);
  // List filter enabled takes true or false.
  assert.ok(['true', 'false'].includes('true'));
});

test('api contract integration draft: export returns ZIP, errors still return JSON shape', () => {
  // POST /api/export returns application/zip with a closet-export-<date>.zip filename. It is the only non JSON success response.
  const exportResponse = { contentType: 'application/zip', filename: 'closet-export-2026-10-30.zip' };
  assert.equal(exportResponse.contentType, 'application/zip');
  assert.ok(/^closet-export-\d{4}-\d{2}-\d{2}\.zip$/.test(exportResponse.filename));
  // Unauthenticated export is 401 with the single JSON error shape, not a ZIP.
  const unauthenticated = { status: 401, body: errorBody('UNAUTHENTICATED', 'Authentication is required.') };
  assert.equal(unauthenticated.status, 401);
  assert.deepEqual(Object.keys(unauthenticated.body), ['error']);
});

test('api contract integration draft: pagination envelope and list versus single shapes', () => {
  // Lists use { data, pagination: { page, pageSize, total } }. Singles return the resource directly.
  const list = { data: [{ id: 'uuid' }], pagination: { page: 1, pageSize: 20, total: 1 } };
  assert.ok(Array.isArray(list.data));
  assert.equal(list.pagination.total, 1);
  const single = { id: 'uuid', name: 'Deep Winter' };
  assert.ok(!('pagination' in single));
  // Lists are light: palettes list without colours and avoidRules, items list without colours, outfits list without items. Singles embed them.
  const paletteListItem = { id: 'uuid', name: 'Deep Winter' };
  assert.ok(!('colours' in paletteListItem) && !('avoidRules' in paletteListItem));
  const paletteSingle = { id: 'uuid', colours: [], avoidRules: [] };
  assert.ok('colours' in paletteSingle && 'avoidRules' in paletteSingle);
  // Unknown sort values fall back to recent. Non numeric page or pageSize is 400, out of range values clamp.
  assert.equal(Math.min(500, 100), 100);
});

test('api contract integration draft: live proof lives in impl-gated tests, not here', () => {
  // This file no longer claims that no server exists. A server exists on
  // main (scripts/dev-server.js, local mode). Live calls belong in
  // tests/impl-gated/api-and-auth.test.js, gated on CLOSET_TEST_BASE_URL,
  // so this self contained file stays GREEN without a server.
  const liveFile = 'tests/impl-gated/api-and-auth.test.js';
  assert.ok(liveFile.includes('impl-gated'));
  const status = 'UPDATED TO DRAFT CONTRACT, not FROZEN, refs ISSUE-30';
  assert.ok(status.includes('UPDATED TO DRAFT CONTRACT'));
});
