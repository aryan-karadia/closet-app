// Implementation-gated tests: API and auth against the Agent B DRAFT contract
// in docs/api-contract.md, updated from skeleton paths to real contract
// paths (refs ISSUE-30). Status: UPDATED TO DRAFT CONTRACT, not FROZEN.
// Live tests run only when CLOSET_TEST_BASE_URL is set to a test server
// URL, for example a local dev server started with:
//   CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js
// and CLOSET_TEST_BASE_URL=http://localhost:3101
// Without it, tests are SKIPPED and counted as pending, not faked green.
// Local mode test tokens are Bearer test:<user-id>, local mode only.
// No real credentials are used here. Use placeholders only.
// No live Supabase project is tested here. No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const baseUrl = (process.env.CLOSET_TEST_BASE_URL || '').replace(/\/$/, '');
const missingReason = baseUrl
  ? null
  : 'RED: awaiting test server, CLOSET_TEST_BASE_URL is not set (refs ISSUE-30)';

const skip = missingReason ? { skip: missingReason } : {};
let userCounter = 0;

function user(prefix) {
  userCounter += 1;
  return 'contract-' + prefix + '-' + Date.now() + '-' + userCounter;
}

function authHeaders(userId) {
  return { Authorization: 'Bearer test:' + userId, 'Content-Type': 'application/json' };
}

async function call(method, path, userId, body) {
  const options = { method, headers: userId ? authHeaders(userId) : {} };
  if (body !== undefined) options.body = JSON.stringify(body);
  return fetch(baseUrl + path, options);
}

async function callJson(method, path, userId, body) {
  const response = await call(method, path, userId, body);
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    data = null;
  }
  return { status: response.status, data, text, headers: response.headers };
}

function assertErrorShape(result, status, code) {
  assert.equal(result.status, status);
  assert.ok(result.data && typeof result.data === 'object');
  assert.deepEqual(Object.keys(result.data), ['error']);
  assert.equal(result.data.error.code, code);
  assert.equal(typeof result.data.error.message, 'string');
}

async function createPalette(userId, body) {
  const result = await callJson('POST', '/api/palettes', userId, body || { name: 'Deep Winter' });
  assert.equal(result.status, 201);
  return result.data;
}

async function createItem(userId, body) {
  const result = await callJson('POST', '/api/items', userId, body || { name: 'Sweater', category: 'sweater', season: 'winter' });
  assert.equal(result.status, 201);
  return result.data;
}

test('impl api: unauthenticated requests return 401, API does not redirect', skip, async () => {
  const session = await callJson('GET', '/api/auth/session', null);
  assertErrorShape(session, 401, 'UNAUTHENTICATED');
  const palettes = await callJson('GET', '/api/palettes', null);
  assertErrorShape(palettes, 401, 'UNAUTHENTICATED');
  const exported = await call('POST', '/api/export', null);
  assert.equal(exported.status, 401);
  assert.ok(!String(exported.status).startsWith('3'), 'protected API routes return 401, not a redirect');
});

test('impl api: session and profile work, profile auto created', skip, async () => {
  const userId = user('session');
  const session = await callJson('GET', '/api/auth/session', userId);
  assert.equal(session.status, 200);
  assert.equal(session.data.user.id, userId);
  const profile = await callJson('GET', '/api/profile', userId);
  assert.equal(profile.status, 200);
  assert.equal(profile.data.userId, userId);
  assert.deepEqual(profile.data.fitTags, []);
  const patched = await callJson('PATCH', '/api/profile', userId, { displayName: 'Aryan', fitTags: ['structured shoulder'] });
  assert.equal(patched.status, 200);
  assert.equal(patched.data.displayName, 'Aryan');
  assert.deepEqual(patched.data.fitTags, ['structured shoulder']);
});

test('impl api: wrong owner returns 403 and missing resource returns 404', skip, async () => {
  const owner = user('owner');
  const other = user('other');
  const palette = await createPalette(owner, { name: 'Mine' });
  const wrongOwner = await callJson('GET', '/api/palettes/' + palette.id, other);
  assertErrorShape(wrongOwner, 403, 'FORBIDDEN');
  const missing = await callJson('GET', '/api/palettes/00000000-0000-0000-0000-000000000000', owner);
  assertErrorShape(missing, 404, 'NOT_FOUND');
  // Profile patch: another user's palette id is 403, an unknown palette id is 400.
  const otherPalette = await callJson('PATCH', '/api/profile', other, { activePaletteId: palette.id });
  assertErrorShape(otherPalette, 403, 'FORBIDDEN');
  const unknownPalette = await callJson('PATCH', '/api/profile', owner, { activePaletteId: '00000000-0000-0000-0000-000000000000' });
  assertErrorShape(unknownPalette, 400, 'VALIDATION_ERROR');
});

test('impl api: invalid input returns 400 with single consistent JSON error shape and details', skip, async () => {
  const userId = user('validation');
  const palette = await createPalette(userId, { name: 'Deep Winter' });
  const cases = [
    await callJson('POST', '/api/palettes', userId, {}),
    await callJson('POST', '/api/items', userId, { name: 'No category', season: 'winter' }),
    await callJson('POST', '/api/palettes/' + palette.id + '/colours', userId, { name: 'Bad', hex: '#123', family: 'navy', role: 'neutral' }),
    await callJson('POST', '/api/palettes/' + palette.id + '/colours', userId, { name: 'Bad', hex: '#12284B', family: 'not-a-family', role: 'neutral' }),
    await callJson('POST', '/api/palettes/' + palette.id + '/avoid-rules', userId, { name: 'bad', hueMin: 50, hueMax: 20, saturationMin: 0, saturationMax: 100, lightnessMin: 0, lightnessMax: 100 }),
    await callJson('POST', '/api/items', userId, { name: 'Bad season', category: 'sweater', season: 'monsoon' }),
    await callJson('POST', '/api/advice-rules', userId, { name: 'Bad action', action: 'maybe', reason: 'reason', source: 'source' }),
  ];
  assert.equal(cases.length, 7);
  for (const result of cases) {
    assertErrorShape(result, 400, 'VALIDATION_ERROR');
    assert.ok(result.data.error.details && typeof result.data.error.details === 'object', 'validation errors carry details');
  }
});

test('impl api: method not listed for a path returns 405', skip, async () => {
  const userId = user('method');
  const result = await callJson('PUT', '/api/palettes', userId, {});
  assertErrorShape(result, 405, 'METHOD_NOT_ALLOWED');
  const sessionDelete = await callJson('DELETE', '/api/auth/session', userId);
  assertErrorShape(sessionDelete, 405, 'METHOD_NOT_ALLOWED');
});

test('impl api: palette, colour, and avoid rule CRUD with embedded single read', skip, async () => {
  const userId = user('palette');
  const palette = await createPalette(userId, { name: 'Deep Winter', isActive: true });
  assert.equal(palette.version, 1);
  assert.equal(palette.isActive, true);
  const colour = await callJson('POST', '/api/palettes/' + palette.id + '/colours', userId, { name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral' });
  assert.equal(colour.status, 201);
  assert.equal(typeof colour.data.labL, 'number');
  const rule = await callJson('POST', '/api/palettes/' + palette.id + '/avoid-rules', userId, { name: 'warm oranges', hueMin: 20, hueMax: 50, saturationMin: 41, saturationMax: 100, lightnessMin: 30, lightnessMax: 70 });
  assert.equal(rule.status, 201);
  const fetched = await callJson('GET', '/api/palettes/' + palette.id, userId);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.data.colours.length, 1);
  assert.equal(fetched.data.avoidRules.length, 1);
  // List responses are light: no embedded colours or avoidRules on list items.
  const listed = await callJson('GET', '/api/palettes', userId);
  assert.equal(listed.status, 200);
  assert.ok(Array.isArray(listed.data.data));
  assert.deepEqual(Object.keys(listed.data.pagination).sort(), ['page', 'pageSize', 'total']);
  assert.ok(!('colours' in listed.data.data[0]));
  // Colour filter by role.
  const filtered = await callJson('GET', '/api/palettes/' + palette.id + '/colours?role=neutral', userId);
  assert.equal(filtered.status, 200);
  assert.equal(filtered.data.data.length, 1);
  // Delete a colour, then the rule, then the palette.
  const delColour = await callJson('DELETE', '/api/palettes/' + palette.id + '/colours/' + colour.data.id, userId);
  assert.equal(delColour.status, 200);
  assert.deepEqual(delColour.data, { deleted: true, id: colour.data.id });
  const delRule = await callJson('DELETE', '/api/palettes/' + palette.id + '/avoid-rules/' + rule.data.id, userId);
  assert.equal(delRule.status, 200);
  const delPalette = await callJson('DELETE', '/api/palettes/' + palette.id, userId);
  assert.equal(delPalette.status, 200);
  const gone = await callJson('GET', '/api/palettes/' + palette.id, userId);
  assertErrorShape(gone, 404, 'NOT_FOUND');
});

test('impl api: palette activate, versions, and rerate', skip, async () => {
  const userId = user('version');
  const first = await createPalette(userId, { name: 'First', isActive: true });
  const second = await createPalette(userId, { name: 'Second', isActive: true });
  const firstAfter = await callJson('GET', '/api/palettes/' + first.id, userId);
  assert.equal(firstAfter.data.isActive, false, 'creating an active palette deactivates others');
  const activated = await callJson('POST', '/api/palettes/' + first.id + '/activate', userId);
  assert.equal(activated.status, 200);
  assert.equal(activated.data.isActive, true);
  const secondAfter = await callJson('GET', '/api/palettes/' + second.id, userId);
  assert.equal(secondAfter.data.isActive, false);
  await callJson('POST', '/api/palettes/' + first.id + '/colours', userId, { name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral' });
  const version = await callJson('POST', '/api/palettes/' + first.id + '/versions', userId, {});
  assert.equal(version.status, 201);
  assert.equal(version.data.version, 2);
  assert.equal(version.data.colours.length, 1);
  const original = await callJson('GET', '/api/palettes/' + first.id, userId);
  assert.equal(original.status, 200, 'original palette is kept after versioning');
  const item = await createItem(userId, { name: 'Navy sweater', category: 'sweater', season: 'winter', colours: [{ hex: '#12284B', percentage: 90, isPrimary: true }] });
  assert.equal(item.colours.length, 1);
  const rerate = await callJson('POST', '/api/palettes/' + first.id + '/rerate', userId);
  assert.equal(rerate.status, 200);
  assert.equal(rerate.data.paletteId, first.id);
  assert.equal(rerate.data.totalCount, 1);
  assert.equal(rerate.data.reratedCount + rerate.data.skippedCount, rerate.data.totalCount);
});

test('impl api: item CRUD, colours replace, manual score, and soft delete lifecycle', skip, async () => {
  const userId = user('item');
  const palette = await createPalette(userId, { name: 'Deep Winter', isActive: true });
  await callJson('POST', '/api/palettes/' + palette.id + '/colours', userId, { name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral' });
  const item = await createItem(userId, { name: 'Navy sweater', category: 'sweater', season: 'winter', price: 100, colours: [{ hex: '#12284B', percentage: 90, isPrimary: true }] });
  assert.equal(item.wearCount, 0);
  assert.equal(item.lastWornAt, null);
  assert.equal(item.costPerWear, null);
  assert.ok(item.paletteScore !== null);
  const fetched = await callJson('GET', '/api/items/' + item.id, userId);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.data.colours.length, 1);
  // Replace colours with two primaries is 400. Replace with an empty set clears primary and scores.
  const twoPrimaries = await callJson('POST', '/api/items/' + item.id + '/colours', userId, { colours: [{ hex: '#12284B', percentage: 50, isPrimary: true }, { hex: '#FFFFFF', percentage: 50, isPrimary: true }] });
  assertErrorShape(twoPrimaries, 400, 'VALIDATION_ERROR');
  const cleared = await callJson('POST', '/api/items/' + item.id + '/colours', userId, { colours: [] });
  assert.equal(cleared.status, 200);
  assert.deepEqual(cleared.data.data, []);
  const afterClear = await callJson('GET', '/api/items/' + item.id, userId);
  assert.equal(afterClear.data.primaryColorHex, null);
  assert.equal(afterClear.data.paletteScore, null);
  // Manual score override sets effective paletteScore without overwriting autoScore, after re-rating the item first.
  await callJson('POST', '/api/items/' + item.id + '/colours', userId, { colours: [{ hex: '#12284B', percentage: 90, isPrimary: true }] });
  const rated = await callJson('GET', '/api/items/' + item.id, userId);
  assert.ok(rated.data.autoScore !== null);
  const manual = await callJson('PATCH', '/api/items/' + item.id, userId, { manualScore: 80, manualScoreNote: 'Fits well' });
  assert.equal(manual.status, 200);
  assert.equal(manual.data.paletteScore, 80);
  assert.equal(manual.data.autoScore, rated.data.autoScore);
  const unmanual = await callJson('PATCH', '/api/items/' + item.id, userId, { manualScore: null });
  assert.equal(unmanual.data.paletteScore, unmanual.data.autoScore);
  // Restore of a non deleted item is 400, permanent delete of a non soft deleted item is 400.
  const restoreLive = await callJson('POST', '/api/items/' + item.id + '/restore', userId);
  assertErrorShape(restoreLive, 400, 'VALIDATION_ERROR');
  const permanentLive = await callJson('POST', '/api/items/' + item.id + '/permanent-delete', userId);
  assertErrorShape(permanentLive, 400, 'VALIDATION_ERROR');
  // Soft delete: single read is 404, list excludes it, restore brings it back, then permanent delete removes it.
  const soft = await callJson('DELETE', '/api/items/' + item.id, userId);
  assert.equal(soft.status, 200);
  assert.deepEqual(soft.data, { deleted: true, id: item.id, softDeleted: true });
  const readDeleted = await callJson('GET', '/api/items/' + item.id, userId);
  assertErrorShape(readDeleted, 404, 'NOT_FOUND');
  const restored = await callJson('POST', '/api/items/' + item.id + '/restore', userId);
  assert.equal(restored.status, 200);
  assert.equal(restored.data.status, 'in rotation');
  await callJson('DELETE', '/api/items/' + item.id, userId);
  const permanent = await callJson('POST', '/api/items/' + item.id + '/permanent-delete', userId);
  assert.deepEqual(permanent.data, { deleted: true, id: item.id, softDeleted: false });
  const gone = await callJson('GET', '/api/items/' + item.id, userId);
  assertErrorShape(gone, 404, 'NOT_FOUND');
});

test('impl api: outfit CRUD, duplicate slot, outfit items, and missing item distinction', skip, async () => {
  const userId = user('outfit');
  const top = await createItem(userId, { name: 'Top', category: 'sweater', season: 'winter' });
  const bottom = await createItem(userId, { name: 'Bottom', category: 'trousers', season: 'winter' });
  // Missing item referenced in outfit create is 400, while the single item endpoint returns 404 for that item.
  const missingItem = await callJson('GET', '/api/items/00000000-0000-0000-0000-000000000000', userId);
  assertErrorShape(missingItem, 404, 'NOT_FOUND');
  const badOutfit = await callJson('POST', '/api/outfits', userId, { occasion: 'daily', season: 'winter', items: [{ itemId: '00000000-0000-0000-0000-000000000000', slot: 'base-top' }] });
  assertErrorShape(badOutfit, 400, 'VALIDATION_ERROR');
  const duplicateSlot = await callJson('POST', '/api/outfits', userId, { occasion: 'daily', season: 'winter', items: [{ itemId: top.id, slot: 'base-top' }, { itemId: bottom.id, slot: 'base-top' }] });
  assertErrorShape(duplicateSlot, 400, 'VALIDATION_ERROR');
  const outfit = await callJson('POST', '/api/outfits', userId, { occasion: 'daily', season: 'winter', items: [{ itemId: top.id, slot: 'base-top' }] });
  assert.equal(outfit.status, 201);
  assert.equal(outfit.data.items.length, 1);
  const added = await callJson('POST', '/api/outfits/' + outfit.data.id + '/items', userId, { itemId: bottom.id, slot: 'bottom' });
  assert.equal(added.status, 201);
  assert.equal(added.data.itemId, bottom.id);
  const duplicateAdd = await callJson('POST', '/api/outfits/' + outfit.data.id + '/items', userId, { itemId: bottom.id, slot: 'shoes' });
  assertErrorShape(duplicateAdd, 400, 'VALIDATION_ERROR');
  const listed = await callJson('GET', '/api/outfits/' + outfit.data.id + '/items', userId);
  assert.equal(listed.data.data.length, 2);
  const removed = await callJson('DELETE', '/api/outfits/' + outfit.data.id + '/items/' + bottom.id, userId);
  assert.deepEqual(removed.data, { deleted: true, outfitId: outfit.data.id, itemId: bottom.id });
  const patched = await callJson('PATCH', '/api/outfits/' + outfit.data.id, userId, { saved: true });
  assert.equal(patched.data.saved, true);
  const deleted = await callJson('DELETE', '/api/outfits/' + outfit.data.id, userId);
  assert.equal(deleted.status, 200);
});

test('impl api: wear log increments counts and delete decrements without rewriting lastWornAt', skip, async () => {
  const userId = user('wear');
  const item = await createItem(userId, { name: 'Sweater', category: 'sweater', season: 'winter', price: 90 });
  const outfit = await callJson('POST', '/api/outfits', userId, { occasion: 'daily', season: 'winter', items: [{ itemId: item.id, slot: 'base-top' }] });
  assert.equal(outfit.status, 201);
  const empty = await callJson('POST', '/api/wear-logs', userId, { outfitId: outfit.data.id, itemIds: [] });
  assertErrorShape(empty, 400, 'VALIDATION_ERROR');
  const log = await callJson('POST', '/api/wear-logs', userId, { outfitId: outfit.data.id, itemIds: [item.id], wornAt: '2026-10-30', occasion: 'daily' });
  assert.equal(log.status, 201);
  assert.equal(log.data.itemSnapshots[0].itemName, 'Sweater');
  const after = await callJson('GET', '/api/items/' + item.id, userId);
  assert.equal(after.data.wearCount, 1);
  assert.equal(after.data.costPerWear, 90);
  const wornAt = after.data.lastWornAt;
  const deleted = await callJson('DELETE', '/api/wear-logs/' + log.data.id, userId);
  assert.equal(deleted.status, 200);
  const afterDelete = await callJson('GET', '/api/items/' + item.id, userId);
  assert.equal(afterDelete.data.wearCount, 0);
  assert.equal(afterDelete.data.lastWornAt, wornAt, 'wear log delete leaves lastWornAt unchanged per contract');
});

test('impl api: advice rules CRUD and seed idempotency', skip, async () => {
  const userId = user('advice');
  const first = await callJson('POST', '/api/advice-rules/seed', userId);
  assert.equal(first.status, 201);
  assert.equal(first.data.seeded, true);
  assert.equal(first.data.data.length, 10);
  const second = await callJson('POST', '/api/advice-rules/seed', userId);
  assert.equal(second.status, 200);
  assert.equal(second.data.seeded, false);
  assert.equal(second.data.data.length, 10);
  const created = await callJson('POST', '/api/advice-rules', user('advice2'), { name: 'Shoulders first', action: 'prefer', reason: 'Size for wide shoulders and large traps first.', source: 'User stated fit preference' });
  assert.equal(created.status, 201);
  assert.equal(created.data.weight, 50);
  assert.equal(created.data.enabled, true);
  const disabled = await callJson('PATCH', '/api/advice-rules/' + created.data.id, user('advice2'), { enabled: false });
  // Note: the PATCH above uses a different user on purpose to check ownership below is separate; redo with the owning user.
  assertErrorShape(disabled, 403, 'FORBIDDEN');
  const owner = created.data.userId;
  const disabledByOwner = await callJson('PATCH', '/api/advice-rules/' + created.data.id, owner, { enabled: false });
  assert.equal(disabledByOwner.status, 200);
  assert.equal(disabledByOwner.data.enabled, false);
  const enabledList = await callJson('GET', '/api/advice-rules?enabled=false', owner);
  assert.equal(enabledList.status, 200);
  assert.ok(enabledList.data.data.some((r) => r.id === created.data.id));
  const deleted = await callJson('DELETE', '/api/advice-rules/' + created.data.id, owner);
  assert.equal(deleted.status, 200);
});

test('impl api: uploads accept WebP only, signed URL serves file, storage without token is 401', skip, async () => {
  const userId = user('upload');
  const base64 = Buffer.from('fake-webp-bytes').toString('base64');
  const uploaded = await callJson('POST', '/api/uploads', userId, { contentType: 'image/webp', kind: 'image', width: 1200, height: 800, dataBase64: base64 });
  assert.equal(uploaded.status, 201);
  assert.ok(uploaded.data.path.startsWith('items/' + userId + '/'));
  assert.equal(typeof uploaded.data.signedUrl, 'string');
  const fileResponse = await fetch(baseUrl + uploaded.data.signedUrl);
  assert.equal(fileResponse.status, 200);
  assert.equal(await fileResponse.text(), 'fake-webp-bytes');
  const png = await callJson('POST', '/api/uploads', userId, { contentType: 'image/png', kind: 'image', width: 100, height: 100, dataBase64: base64 });
  assertErrorShape(png, 400, 'VALIDATION_ERROR');
  const tooWide = await callJson('POST', '/api/uploads', userId, { contentType: 'image/webp', kind: 'image', width: 1201, height: 800, dataBase64: base64 });
  assertErrorShape(tooWide, 400, 'VALIDATION_ERROR');
  const tooWideThumb = await callJson('POST', '/api/uploads', userId, { contentType: 'image/webp', kind: 'thumbnail', width: 401, height: 400, dataBase64: base64 });
  assertErrorShape(tooWideThumb, 400, 'VALIDATION_ERROR');
  const wrongPath = await callJson('POST', '/api/uploads', userId, { path: 'items/someone-else/x.webp', contentType: 'image/webp', kind: 'image', width: 100, height: 100, dataBase64: base64 });
  assertErrorShape(wrongPath, 403, 'FORBIDDEN');
  const missingSigned = await callJson('POST', '/api/uploads/signed-url', userId, { path: 'items/' + userId + '/nope.webp' });
  assertErrorShape(missingSigned, 404, 'NOT_FOUND');
  const signed = await callJson('POST', '/api/uploads/signed-url', userId, { path: uploaded.data.path });
  assert.equal(signed.status, 200);
  assert.equal(signed.data.path, uploaded.data.path);
  assert.equal(typeof signed.data.expiresAt, 'string');
  const noToken = await fetch(baseUrl + '/api/storage/items/' + userId + '/x.webp');
  assert.equal(noToken.status, 401);
});

test('impl api: export returns a ZIP for an authenticated user', skip, async () => {
  const userId = user('export');
  await createItem(userId, { name: 'Sweater', category: 'sweater', season: 'winter' });
  const response = await fetch(baseUrl + '/api/export', { method: 'POST', headers: authHeaders(userId) });
  assert.equal(response.status, 200);
  assert.ok((response.headers.get('content-type') || '').includes('application/zip'));
  const buffer = Buffer.from(await response.arrayBuffer());
  assert.equal(buffer[0], 0x50);
  assert.equal(buffer[1], 0x4B);
  assert.ok(buffer.toString('utf8').includes('items.json'));
});

test('impl api: pagination envelope and pageSize clamping', skip, async () => {
  const userId = user('page');
  await createItem(userId, { name: 'Sweater', category: 'sweater', season: 'winter' });
  const listed = await callJson('GET', '/api/items?page=1&pageSize=500', userId);
  assert.equal(listed.status, 200);
  assert.deepEqual(Object.keys(listed.data).sort(), ['data', 'pagination']);
  assert.equal(listed.data.pagination.pageSize, 100, 'pageSize above 100 clamps to 100 per contract');
  assert.equal(listed.data.pagination.total, 1);
  const badPage = await callJson('GET', '/api/items?page=abc', userId);
  assertErrorShape(badPage, 400, 'VALIDATION_ERROR');
});

test('impl api and auth: gate state marker', () => {
  assert.equal(missingReason === null, baseUrl !== '');
  if (missingReason) assert.ok(missingReason.startsWith('RED: awaiting test server'));
});
