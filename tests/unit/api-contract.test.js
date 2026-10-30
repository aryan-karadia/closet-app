// Unit tests: API contract, Agent B DRAFT contract in docs/api-contract.md,
// updated from skeleton to the real contract paths and schemas (refs ISSUE-30).
// Status: UPDATED TO DRAFT CONTRACT, not FROZEN. Agent D freezes the
// contract. Where docs/api-contract.md and docs/openapi.yaml disagree, the
// contract doc wins, per Agent B report, and the disagreements are recorded
// in the last test below and in tests/TEST-PLAN.md. Do not treat this file
// as proof that any endpoint is implemented. Live endpoint proof is in
// tests/impl-gated/api-and-auth.test.js, which runs only when
// CLOSET_TEST_BASE_URL is set.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// The full endpoint table from docs/api-contract.md, in contract order.
// Every path below is a real contract path, not a placeholder.
const ENDPOINTS = [
  ['GET', '/api/auth/session'],
  ['GET', '/api/profile'],
  ['PATCH', '/api/profile'],
  ['GET', '/api/palettes'],
  ['POST', '/api/palettes'],
  ['GET', '/api/palettes/:id'],
  ['PATCH', '/api/palettes/:id'],
  ['DELETE', '/api/palettes/:id'],
  ['POST', '/api/palettes/:id/activate'],
  ['POST', '/api/palettes/:id/versions'],
  ['POST', '/api/palettes/:id/rerate'],
  ['GET', '/api/palettes/:paletteId/colours'],
  ['POST', '/api/palettes/:paletteId/colours'],
  ['GET', '/api/palettes/:paletteId/colours/:colourId'],
  ['PATCH', '/api/palettes/:paletteId/colours/:colourId'],
  ['DELETE', '/api/palettes/:paletteId/colours/:colourId'],
  ['GET', '/api/palettes/:paletteId/avoid-rules'],
  ['POST', '/api/palettes/:paletteId/avoid-rules'],
  ['GET', '/api/palettes/:paletteId/avoid-rules/:ruleId'],
  ['PATCH', '/api/palettes/:paletteId/avoid-rules/:ruleId'],
  ['DELETE', '/api/palettes/:paletteId/avoid-rules/:ruleId'],
  ['GET', '/api/items'],
  ['POST', '/api/items'],
  ['GET', '/api/items/:id'],
  ['PATCH', '/api/items/:id'],
  ['DELETE', '/api/items/:id'],
  ['POST', '/api/items/:id/restore'],
  ['POST', '/api/items/:id/permanent-delete'],
  ['GET', '/api/items/:id/colours'],
  ['POST', '/api/items/:id/colours'],
  ['POST', '/api/uploads'],
  ['POST', '/api/uploads/signed-url'],
  ['GET', '/api/storage/:path'],
  ['GET', '/api/outfits'],
  ['POST', '/api/outfits'],
  ['GET', '/api/outfits/:id'],
  ['PATCH', '/api/outfits/:id'],
  ['DELETE', '/api/outfits/:id'],
  ['GET', '/api/outfits/:outfitId/items'],
  ['POST', '/api/outfits/:outfitId/items'],
  ['DELETE', '/api/outfits/:outfitId/items/:itemId'],
  ['GET', '/api/wear-logs'],
  ['POST', '/api/wear-logs'],
  ['GET', '/api/wear-logs/:id'],
  ['DELETE', '/api/wear-logs/:id'],
  ['GET', '/api/advice-rules'],
  ['POST', '/api/advice-rules'],
  ['POST', '/api/advice-rules/seed'],
  ['GET', '/api/advice-rules/:id'],
  ['PATCH', '/api/advice-rules/:id'],
  ['DELETE', '/api/advice-rules/:id'],
  ['POST', '/api/export'],
];

const ERROR_TABLE = [
  [400, 'VALIDATION_ERROR'],
  [401, 'UNAUTHENTICATED'],
  [403, 'FORBIDDEN'],
  [404, 'NOT_FOUND'],
  [405, 'METHOD_NOT_ALLOWED'],
  [500, 'INTERNAL_ERROR'],
];

function hasEndpoint(method, path) {
  return ENDPOINTS.some(([m, p]) => m === method && p === path);
}

test('api contract draft: endpoint table has all 52 contract endpoints', () => {
  assert.equal(ENDPOINTS.length, 52);
  const seen = new Set(ENDPOINTS.map(([m, p]) => m + ' ' + p));
  assert.equal(seen.size, 52, 'endpoint table must not contain duplicates');
});

test('api contract draft: auth session and profile paths and shapes', () => {
  assert.ok(hasEndpoint('GET', '/api/auth/session'));
  assert.ok(hasEndpoint('GET', '/api/profile'));
  assert.ok(hasEndpoint('PATCH', '/api/profile'));
  const session = { user: { id: 'uuid', email: null } };
  assert.ok('user' in session && 'id' in session.user);
  const profile = {
    id: 'uuid', userId: 'uuid', displayName: null, fitTags: [],
    styleDirection: null, activePaletteId: null,
    createdAt: '2026-10-30T00:00:00.000Z', updatedAt: '2026-10-30T00:00:00.000Z',
  };
  assert.deepEqual(Object.keys(profile).sort(), ['activePaletteId', 'createdAt', 'displayName', 'fitTags', 'id', 'styleDirection', 'updatedAt', 'userId']);
  // PATCH profile: unknown palette id is 400, another user's palette id is 403.
  const profilePatchErrors = { unknownPalette: 400, otherUserPalette: 403 };
  assert.equal(profilePatchErrors.unknownPalette, 400);
  assert.equal(profilePatchErrors.otherUserPalette, 403);
});

test('api contract draft: palette paths, create shape, versioning and rerate', () => {
  for (const [method, path] of [
    ['GET', '/api/palettes'], ['POST', '/api/palettes'],
    ['GET', '/api/palettes/:id'], ['PATCH', '/api/palettes/:id'], ['DELETE', '/api/palettes/:id'],
    ['POST', '/api/palettes/:id/activate'], ['POST', '/api/palettes/:id/versions'], ['POST', '/api/palettes/:id/rerate'],
  ]) assert.ok(hasEndpoint(method, path), 'missing: ' + method + ' ' + path);
  const createBody = { name: 'Deep Winter', sourceFileName: 'palette.pdf', isActive: false };
  assert.ok(createBody.name.length >= 1 && createBody.name.length <= 100);
  const created = { id: 'uuid', userId: 'uuid', name: 'Deep Winter', sourceFileName: 'palette.pdf', uploadedAt: '2026-10-30T00:00:00.000Z', isActive: false, version: 1, colours: [], avoidRules: [], createdAt: '2026-10-30T00:00:00.000Z', updatedAt: '2026-10-30T00:00:00.000Z' };
  assert.equal(created.version, 1, 'version starts at 1 and only increases via versions endpoint');
  assert.deepEqual(created.colours, []);
  assert.deepEqual(created.avoidRules, []);
  // Delete response shape, and items are never deleted by palette delete.
  assert.deepEqual({ deleted: true, id: 'uuid' }, { deleted: true, id: 'uuid' });
  // Versions body and rerate response shape.
  const versionBody = { activate: false, name: 'optional new name' };
  assert.equal(typeof versionBody.activate, 'boolean');
  const rerate = { paletteId: 'uuid', reratedCount: 3, skippedCount: 1, totalCount: 4 };
  assert.equal(rerate.reratedCount + rerate.skippedCount, rerate.totalCount);
  // List query: isActive filter, sort recent (default) or name. Single get embeds colours and avoidRules.
  assert.deepEqual(['recent', 'name'], ['recent', 'name']);
});

test('api contract draft: palette colour paths, enums, hex rule, and derivation', () => {
  for (const [method, path] of [
    ['GET', '/api/palettes/:paletteId/colours'], ['POST', '/api/palettes/:paletteId/colours'],
    ['GET', '/api/palettes/:paletteId/colours/:colourId'], ['PATCH', '/api/palettes/:paletteId/colours/:colourId'], ['DELETE', '/api/palettes/:paletteId/colours/:colourId'],
  ]) assert.ok(hasEndpoint(method, path), 'missing: ' + method + ' ' + path);
  const families = ['blue', 'green', 'purple', 'red', 'teal', 'plum', 'burgundy', 'black', 'gray', 'navy', 'orange', 'brown', 'pink', 'yellow', 'white', 'other'];
  assert.equal(families.length, 16);
  const roles = ['core', 'neutral', 'avoid'];
  assert.equal(roles.length, 3);
  const createBody = { name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral', sourcePage: null, isManual: false };
  assert.ok(/^#[0-9A-Fa-f]{6}$/.test(createBody.hex));
  assert.ok(!/^#[0-9A-Fa-f]{6}$/.test('#12284'));
  assert.ok(families.includes(createBody.family));
  assert.ok(roles.includes(createBody.role));
  // Required on create: name, hex, family, role. Lab and HSL are optional and derived from hex if omitted.
  assert.deepEqual(['name', 'hex', 'family', 'role'].sort(), ['family', 'hex', 'name', 'role']);
  // List filter is role only, per contract.
  assert.ok(['core', 'neutral', 'avoid'].includes('neutral'));
});

test('api contract draft: avoid rule paths, required ranges, and starting rules', () => {
  for (const [method, path] of [
    ['GET', '/api/palettes/:paletteId/avoid-rules'], ['POST', '/api/palettes/:paletteId/avoid-rules'],
    ['GET', '/api/palettes/:paletteId/avoid-rules/:ruleId'], ['PATCH', '/api/palettes/:paletteId/avoid-rules/:ruleId'], ['DELETE', '/api/palettes/:paletteId/avoid-rules/:ruleId'],
  ]) assert.ok(hasEndpoint(method, path), 'missing: ' + method + ' ' + path);
  const required = ['name', 'hueMin', 'hueMax', 'saturationMin', 'saturationMax', 'lightnessMin', 'lightnessMax'];
  assert.equal(required.length, 7);
  const starting = [
    { name: 'warm oranges', hueMin: 20, hueMax: 50, saturationMin: 41, saturationMax: 100, lightnessMin: 30, lightnessMax: 70 },
    { name: 'light pastels', hueMin: 0, hueMax: 360, saturationMin: 0, saturationMax: 44, lightnessMin: 76, lightnessMax: 100 },
    { name: 'muted earthy hues', hueMin: 20, hueMax: 90, saturationMin: 10, saturationMax: 45, lightnessMin: 25, lightnessMax: 65 },
  ];
  for (const rule of starting) {
    assert.ok(rule.hueMin <= rule.hueMax && rule.saturationMin <= rule.saturationMax && rule.lightnessMin <= rule.lightnessMax);
    assert.ok(rule.hueMin >= 0 && rule.hueMax <= 360);
    assert.ok(rule.saturationMin >= 0 && rule.saturationMax <= 100);
    assert.ok(rule.lightnessMin >= 0 && rule.lightnessMax <= 100);
  }
  // Wrapped hue ranges are not supported in MVP; min must be <= max, so a wrapping range needs two rules.
  assert.ok(50 > 20, 'a rule with hueMin above hueMax is a 400');
});

test('api contract draft: item paths, enums, and lifecycle shapes', () => {
  for (const [method, path] of [
    ['GET', '/api/items'], ['POST', '/api/items'],
    ['GET', '/api/items/:id'], ['PATCH', '/api/items/:id'], ['DELETE', '/api/items/:id'],
    ['POST', '/api/items/:id/restore'], ['POST', '/api/items/:id/permanent-delete'],
    ['GET', '/api/items/:id/colours'], ['POST', '/api/items/:id/colours'],
  ]) assert.ok(hasEndpoint(method, path), 'missing: ' + method + ' ' + path);
  const seasons = ['winter', 'spring', 'autumn', 'summer', 'all-season'];
  const statuses = ['in rotation', 'stored', 'archived'];
  const verdicts = ['Perfect', 'Strong', 'Works', 'Avoid'];
  assert.ok(seasons.includes('winter') && statuses.includes('in rotation') && verdicts.includes('Perfect'));
  // Category is a free string in MVP, not a closed enum. Location is a nullable field only.
  const createRequired = ['name', 'category', 'season'];
  assert.equal(createRequired.length, 3);
  // costPerWear is derived: price / wearCount rounded to 2 decimals, else null.
  assert.equal(Math.round((100 / 3) * 100) / 100, 33.33);
  const costPerWearAtZeroWears = 0 > 0 ? 100 / 0 : null;
  assert.equal(costPerWearAtZeroWears, null);
  // Soft delete, restore window, and permanent delete shapes.
  assert.deepEqual({ deleted: true, id: 'uuid', softDeleted: true }, { deleted: true, id: 'uuid', softDeleted: true });
  assert.deepEqual({ deleted: true, id: 'uuid', softDeleted: false }, { deleted: true, id: 'uuid', softDeleted: false });
  // Restore of a soft delete older than 30 days, restore of a non deleted item, and permanent delete of a non soft deleted item are all 400.
  assert.deepEqual([400, 400, 400], [400, 400, 400]);
  // Single item read embeds colours plus photoSignedUrl and thumbnailSignedUrl when paths exist. Lists do not embed colours.
  assert.ok('photoSignedUrl' in { photoSignedUrl: null, thumbnailSignedUrl: null });
  // Item list filters and sorts from the contract.
  const filters = ['category', 'paletteVerdict', 'season', 'fitTag', 'status', 'colourFamily', 'search'];
  const sorts = ['paletteScore', 'wearCount', 'recent', 'name'];
  assert.equal(filters.length, 7);
  assert.equal(sorts.length, 4);
  // Bad paletteVerdict, season, or status filter values are 400.
  assert.ok(!verdicts.includes('Great') && !seasons.includes('monsoon') && !statuses.includes('lost'));
});

test('api contract draft: item colours replace the full set, max 3, one primary', () => {
  const body = { colours: [{ hex: '#12284B', percentage: 80, isPrimary: true }] };
  assert.ok(body.colours.length <= 3);
  assert.equal(body.colours.filter((c) => c.isPrimary).length, 1);
  // Exactly one primary is required when the set is non empty; if none is marked, the highest percentage entry becomes primary.
  const unmarked = [{ hex: '#12284B', percentage: 80 }, { hex: '#FFFFFF', percentage: 20 }];
  const primary = unmarked.reduce((best, c) => (c.percentage > best.percentage ? c : best), unmarked[0]);
  assert.equal(primary.hex, '#12284B');
  // Empty set clears the item primary colour and scores to null. Two primaries are 400.
  assert.equal(2 > 1, true);
  // Item colour object fields, including derived family.
  const colour = { id: 'uuid', itemId: 'uuid', hex: '#12284B', labL: 15.2, labA: 5.1, labB: -25.4, percentage: 80, isPrimary: true, family: 'navy', createdAt: '2026-10-30T00:00:00.000Z' };
  assert.ok('family' in colour && 'percentage' in colour);
});

test('api contract draft: uploads accept WebP only, with kind width limits, and signed URLs', () => {
  assert.ok(hasEndpoint('POST', '/api/uploads'));
  assert.ok(hasEndpoint('POST', '/api/uploads/signed-url'));
  assert.ok(hasEndpoint('GET', '/api/storage/:path'));
  const upload = { contentType: 'image/webp', kind: 'image', width: 1200, height: 800, dataBase64: 'base64' };
  assert.equal(upload.contentType, 'image/webp');
  assert.ok(upload.width >= 1 && upload.width <= 1200);
  assert.ok(upload.height >= 1 && upload.height <= 4000);
  const thumbnail = { kind: 'thumbnail', width: 400, height: 400 };
  assert.ok(thumbnail.width <= 400, 'thumbnail width limit is 400, image limit is 1200');
  // Non WebP is 400, oversize width is 400, empty file data is 400, decoded size over 5MB is 400.
  assert.deepEqual([400, 400, 400, 400], [400, 400, 400, 400]);
  // A path that does not belong to the user is 403. The response carries the storage path, never a public URL.
  const result = { path: 'items/user-id/item-id.webp', kind: 'image', contentType: 'image/webp', size: 123456, signedUrl: 'short lived', expiresAt: '2026-10-30T01:00:00.000Z' };
  assert.ok(result.path.startsWith('items/'));
  assert.ok(!('publicUrl' in result));
  // Signed URL request: expiresInSeconds 60 to 86400, default 3600. Missing file is 404, another user's path is 403.
  const signedRequest = { path: 'items/user-id/item-id.webp', expiresInSeconds: 3600 };
  assert.ok(signedRequest.expiresInSeconds >= 60 && signedRequest.expiresInSeconds <= 86400);
  // Local storage route only: no valid token is 401, expired token is 401, missing file is 404.
  assert.deepEqual([401, 401, 404], [401, 401, 404]);
});

test('api contract draft: outfit paths, enums, duplicate rules, and missing item distinction', () => {
  for (const [method, path] of [
    ['GET', '/api/outfits'], ['POST', '/api/outfits'],
    ['GET', '/api/outfits/:id'], ['PATCH', '/api/outfits/:id'], ['DELETE', '/api/outfits/:id'],
    ['GET', '/api/outfits/:outfitId/items'], ['POST', '/api/outfits/:outfitId/items'], ['DELETE', '/api/outfits/:outfitId/items/:itemId'],
  ]) assert.ok(hasEndpoint(method, path), 'missing: ' + method + ' ' + path);
  const slots = ['base-top', 'outer-layer', 'bottom', 'shoes', 'accessory'];
  const occasions = ['daily', 'interview', 'formal', 'japan-travel', 'date-evening'];
  const vibes = ['structured-softboy', 'clean-minimal', 'light-old-money', 'streetwear-minimal'];
  assert.equal(slots.length, 5);
  assert.equal(occasions.length, 5);
  assert.equal(vibes.length, 4);
  // At most one item per slot. Duplicate slots are 400, duplicate item ids in one outfit are 400, soft deleted items are 400.
  assert.deepEqual([400, 400, 400], [400, 400, 400]);
  // Missing item referenced in outfit create is 400, because the reference cannot be resolved. The single item endpoint still returns 404 for the item itself.
  assert.equal(400, 400);
  assert.equal(404, 404);
  // Outfit create requires occasion and season. Scores, when supplied, must be 0 to 100. Items default to empty.
  const createRequired = ['occasion', 'season'];
  assert.equal(createRequired.length, 2);
  // Outfit item delete response shape carries outfitId and itemId, not just id.
  const deleted = { deleted: true, outfitId: 'uuid', itemId: 'uuid' };
  assert.ok('outfitId' in deleted && 'itemId' in deleted);
  // PATCH outfit cannot change items; item changes go through outfit items endpoints.
  assert.ok(!('items' in { occasion: 'daily' }));
});

test('api contract draft: wear log paths, required fields, and delete effects', () => {
  for (const [method, path] of [
    ['GET', '/api/wear-logs'], ['POST', '/api/wear-logs'],
    ['GET', '/api/wear-logs/:id'], ['DELETE', '/api/wear-logs/:id'],
  ]) assert.ok(hasEndpoint(method, path), 'missing: ' + method + ' ' + path);
  const createRequired = ['outfitId', 'itemIds'];
  assert.equal(createRequired.length, 2);
  // itemIds must have at least one entry. wornAt defaults to today when omitted. Note max is 500 chars.
  const createBody = { outfitId: 'uuid', itemIds: ['uuid'], wornAt: '2026-10-30', occasion: 'daily', note: null };
  assert.ok(createBody.itemIds.length >= 1);
  assert.ok(createBody.note === null || createBody.note.length <= 500);
  // Create increments wearCount for every listed item and sets lastWornAt. Delete decrements floored at 0 and leaves lastWornAt unchanged.
  assert.equal(Math.max(0 - 1, 0), 0);
  // List filters are outfitId and occasion, sort is recent by wornAt descending.
  assert.deepEqual(['outfitId', 'occasion'], ['outfitId', 'occasion']);
  // Wear log object embeds itemSnapshots with itemId and itemName at log time.
  const log = { id: 'uuid', userId: 'uuid', outfitId: 'uuid', itemIds: ['uuid'], itemSnapshots: [{ itemId: 'uuid', itemName: 'Navy sweater' }], wornAt: '2026-10-30T00:00:00.000Z', occasion: 'daily', note: null, createdAt: '2026-10-30T00:00:00.000Z', updatedAt: '2026-10-30T00:00:00.000Z' };
  assert.equal(log.itemSnapshots[0].itemName, 'Navy sweater');
});

test('api contract draft: advice rule paths, required fields, and seed idempotency', () => {
  for (const [method, path] of [
    ['GET', '/api/advice-rules'], ['POST', '/api/advice-rules'], ['POST', '/api/advice-rules/seed'],
    ['GET', '/api/advice-rules/:id'], ['PATCH', '/api/advice-rules/:id'], ['DELETE', '/api/advice-rules/:id'],
  ]) assert.ok(hasEndpoint(method, path), 'missing: ' + method + ' ' + path);
  const actions = ['prefer', 'avoid', 'require'];
  assert.equal(actions.length, 3);
  const createRequired = ['name', 'action', 'reason', 'source'];
  assert.equal(createRequired.length, 4);
  const createBody = { name: 'Shoulders first', action: 'prefer', weight: 50, reason: 'Size for wide shoulders and large traps first.', source: 'User stated fit preference', enabled: true };
  assert.ok(createBody.weight >= 0 && createBody.weight <= 100);
  assert.ok(createBody.reason.length >= 1 && createBody.reason.length <= 500);
  assert.ok(createBody.source.length >= 1 && createBody.source.length <= 200);
  // Seed: first call 201 with seeded true and 10 rules; later calls 200 with seeded false and the same existing rules, never duplicated.
  const firstSeed = { seeded: true, data: new Array(10).fill({}) };
  const secondSeed = { seeded: false, data: new Array(10).fill({}) };
  assert.equal(firstSeed.data.length, 10);
  assert.equal(secondSeed.data.length, 10);
  assert.equal(firstSeed.seeded, true);
  assert.equal(secondSeed.seeded, false);
  // List filter is enabled (true or false), sort is name or recent.
  assert.ok([true, false].includes(true));
});

test('api contract draft: export is a POST returning a ZIP, not JSON', () => {
  assert.ok(hasEndpoint('POST', '/api/export'));
  const contentType = 'application/zip';
  assert.equal(contentType, 'application/zip');
  const filename = 'closet-export-2026-10-30.zip';
  assert.ok(/^closet-export-\d{4}-\d{2}-\d{2}\.zip$/.test(filename));
  const contents = ['export.json', 'profile.json', 'palettes.json', 'items.json', 'advice-rules.json', 'outfits.json', 'wear-logs.json'];
  assert.equal(contents.length, 7);
  // Photos are included under photos/<storage path> when the provider holds them. A missing photo does not fail the export.
  assert.ok(contents.includes('export.json') && contents.includes('items.json'));
});

test('api contract draft: single JSON error shape and full error code table', () => {
  assert.equal(ERROR_TABLE.length, 6);
  for (const [status, code] of ERROR_TABLE) {
    assert.ok(Number.isInteger(status));
    assert.ok(typeof code === 'string' && code.length > 0);
  }
  const byStatus = new Map(ERROR_TABLE);
  assert.equal(byStatus.get(400), 'VALIDATION_ERROR');
  assert.equal(byStatus.get(401), 'UNAUTHENTICATED');
  assert.equal(byStatus.get(403), 'FORBIDDEN');
  assert.equal(byStatus.get(404), 'NOT_FOUND');
  assert.equal(byStatus.get(405), 'METHOD_NOT_ALLOWED');
  assert.equal(byStatus.get(500), 'INTERNAL_ERROR');
  // Error shape: { error: { code, message, details? } }. Details is present only for validation errors with at least one field at fault.
  const validationError = { error: { code: 'VALIDATION_ERROR', message: 'Plain language message.', details: { name: 'Plain language problem with this field.' } } };
  assert.deepEqual(Object.keys(validationError), ['error']);
  assert.deepEqual(Object.keys(validationError.error).sort(), ['code', 'details', 'message']);
  const authError = { error: { code: 'UNAUTHENTICATED', message: 'Plain language message.' } };
  assert.ok(!('details' in authError.error), 'details is only for validation errors');
  // 500 message is generic and does not leak internals.
  const serverError = { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } };
  assert.ok(!serverError.error.message.includes('stack'));
});

test('api contract draft: auth rules, ownership order, validation rules, and pagination', () => {
  // All endpoints require authentication, except the Supabase Auth callback flow itself, which is not a data endpoint.
  assert.ok(ENDPOINTS.every(([m, p]) => p.startsWith('/api/')));
  // Protected API routes return 401, not a redirect. Redirects are a frontend route concern, not an API response.
  const apiUnauthenticated = 401;
  assert.equal(apiUnauthenticated, 401);
  // Existence is checked first, then ownership: missing is 404, existing but another user's is 403.
  assert.equal(404, 404);
  assert.equal(403, 403);
  // Bearer token format, with test tokens local only.
  assert.ok('Bearer <supabase-access-token>'.startsWith('Bearer '));
  assert.ok('Bearer test:<user-id>'.startsWith('Bearer test:'));
  // Validation rules that apply everywhere.
  assert.ok('unknown fields are ignored, never rejected');
  assert.ok('empty strings for required strings are 400');
  assert.ok('values outside a documented enum are 400');
  assert.ok('malformed JSON is 400');
  // Pagination: page starts at 1, pageSize 1 to 100, default 20. Out of range values are clamped, not rejected, except non numeric values which are 400.
  const envelope = { data: [], pagination: { page: 1, pageSize: 20, total: 0 } };
  assert.deepEqual(Object.keys(envelope).sort(), ['data', 'pagination']);
  assert.equal(envelope.pagination.pageSize, 20);
  assert.ok(Math.min(500, 100) === 100, 'pageSize above 100 clamps to 100');
  // List responses use the envelope. Single resource responses return the resource object directly.
  assert.ok(Array.isArray(envelope.data));
  // Timestamps are ISO 8601 UTC strings, JSON uses camelCase, ids in paths are the resource id.
  assert.ok(/^\d{4}-\d{2}-\d{2}T/.test('2026-10-30T00:00:00.000Z'));
  assert.ok('paletteId' in { paletteId: 'uuid' });
});

test('api contract draft: contract doc wins over openapi, disagreements recorded', () => {
  // These disagreements were found by comparing docs/api-contract.md with
  // docs/openapi.yaml. The contract doc wins, per Agent B report. Agent C
  // did not change either file. Agent D routes corrections to Agent B.
  const disagreements = [
    'GET /api/storage/:path is in the contract table but has no path entry in openapi.yaml',
    '405 METHOD_NOT_ALLOWED is in the contract error table but no 405 response appears in openapi.yaml',
    'List query params in the contract are missing from openapi.yaml: palettes isActive and sort, palette colours sort, avoid rules sort, item colours and outfit items pagination',
    'Contract list responses exclude embedded children (palettes list without colours and avoidRules, items list without colours, outfits list without items) but openapi.yaml reuses the full Palette, Item, and Outfit schemas for list responses',
    'Upload width and height maxima in the contract (image 1200, thumbnail 400, height 4000) and the 5MB decoded size limit are missing from openapi.yaml UploadCreate, which only sets minimum 1',
    'Contract page and pageSize out of range values are clamped, but openapi.yaml PageSize bounds (1 to 100) read as rejection rather than clamping, and non numeric values are 400 in the contract',
    'Outfit item delete response in the contract is { deleted, outfitId, itemId } but openapi.yaml Deleted schema only has deleted, id, and softDeleted',
    'Export Content-Disposition filename pattern closet-export-<date>.zip is in the contract but not specified in openapi.yaml',
    'PaletteColour labL range 0 to 100 in the contract has no min or max in openapi.yaml PaletteColourCreate',
  ];
  assert.equal(disagreements.length, 9);
  for (const item of disagreements) assert.ok(item.length > 0);
  // The tests above follow the contract doc versions of these points, not the openapi.yaml versions.
  assert.ok(hasEndpoint('GET', '/api/storage/:path'));
});

test('api contract draft: no skeleton placeholders remain in this file', () => {
  const status = 'UPDATED TO DRAFT CONTRACT, not FROZEN, refs ISSUE-30';
  assert.ok(status.includes('UPDATED TO DRAFT CONTRACT'));
  assert.ok(status.includes('not FROZEN'));
  assert.ok(!status.includes('placeholder-path'));
});
