// Committed live API tests for the backend (refs ISSUE-01, ISSUE-02,
// ISSUE-05, ISSUE-06, ISSUE-07, ISSUE-08, ISSUE-10, ISSUE-13, ISSUE-14,
// ISSUE-15, ISSUE-21, ISSUE-26, ISSUE-28).
// These tests spawn the dependency free dev server on a local port and
// exercise it over HTTP with test tokens. They do not edit Agent C tests
// and they do not need real Supabase credentials.
// No em dashes are used in this file.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 3199;
const BASE = 'http://localhost:' + PORT;
let server = null;

function auth(user) {
  return { Authorization: 'Bearer test:' + user, 'Content-Type': 'application/json' };
}

async function call(method, url, user, body) {
  const options = { method, headers: user ? auth(user) : {} };
  if (body !== undefined) options.body = JSON.stringify(body);
  return fetch(BASE + url, options);
}

async function callJson(method, url, user, body) {
  const response = await call(method, url, user, body);
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    data = null;
  }
  return { status: response.status, data, text, headers: response.headers };
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE + '/api/auth/session');
      if (response.status === 401) return;
    } catch (error) {
      // Server is not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Dev server did not start in time.');
}

test.before(async () => {
  const root = path.join(__dirname, '..', '..');
  server = spawn('node', ['scripts/dev-server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT), CLOSET_TEST_MODE: '1', CLOSET_FORCE_MEMORY_STORAGE: '1' },
    stdio: 'ignore',
  });
  await waitForServer();
});

test.after(() => {
  if (server) server.kill();
});

test('api: unauthenticated request returns 401 with single error shape', async () => {
  const { status, data } = await callJson('GET', '/api/auth/session', null);
  assert.equal(status, 401);
  assert.equal(data.error.code, 'UNAUTHENTICATED');
  assert.equal(typeof data.error.message, 'string');
});

test('api: unauthenticated request to unknown path returns 401', async () => {
  const { status } = await callJson('GET', '/placeholder-path-to-be-confirmed', null);
  assert.equal(status, 401);
});

test('api: session and profile work for an authenticated user', async () => {
  const user = 'api-session-' + Date.now();
  const session = await callJson('GET', '/api/auth/session', user);
  assert.equal(session.status, 200);
  assert.equal(session.data.user.id, user);
  const profile = await callJson('GET', '/api/profile', user);
  assert.equal(profile.status, 200);
  assert.equal(profile.data.userId, user);
});

test('api: palette, colour, and avoid rule CRUD', async () => {
  const user = 'api-palette-' + Date.now();
  const created = await callJson('POST', '/api/palettes', user, { name: 'Deep Winter', isActive: true });
  assert.equal(created.status, 201);
  const paletteId = created.data.id;
  const colour = await callJson('POST', '/api/palettes/' + paletteId + '/colours', user, {
    name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral',
  });
  assert.equal(colour.status, 201);
  assert.equal(typeof colour.data.labL, 'number');
  const rule = await callJson('POST', '/api/palettes/' + paletteId + '/avoid-rules', user, {
    name: 'warm oranges', hueMin: 20, hueMax: 50, saturationMin: 41, saturationMax: 100, lightnessMin: 30, lightnessMax: 70,
  });
  assert.equal(rule.status, 201);
  const badRule = await callJson('POST', '/api/palettes/' + paletteId + '/avoid-rules', user, {
    name: 'bad', hueMin: 50, hueMax: 20, saturationMin: 0, saturationMax: 100, lightnessMin: 0, lightnessMax: 100,
  });
  assert.equal(badRule.status, 400);
  assert.equal(badRule.data.error.code, 'VALIDATION_ERROR');
  const fetched = await callJson('GET', '/api/palettes/' + paletteId, user);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.data.colours.length, 1);
  assert.equal(fetched.data.avoidRules.length, 1);
});

test('api: wrong owner returns 403 and missing resource returns 404', async () => {
  const user = 'api-owner-' + Date.now();
  const created = await callJson('POST', '/api/palettes', user, { name: 'Mine' });
  const paletteId = created.data.id;
  const wrongOwner = await callJson('GET', '/api/palettes/' + paletteId, 'someone-else');
  assert.equal(wrongOwner.status, 403);
  assert.equal(wrongOwner.data.error.code, 'FORBIDDEN');
  const missing = await callJson('GET', '/api/palettes/00000000-0000-0000-0000-000000000000', user);
  assert.equal(missing.status, 404);
  assert.equal(missing.data.error.code, 'NOT_FOUND');
});

test('api: item create auto rates against the active palette', async () => {
  const user = 'api-item-' + Date.now();
  const palette = await callJson('POST', '/api/palettes', user, { name: 'Deep Winter', isActive: true });
  const paletteId = palette.data.id;
  await callJson('POST', '/api/palettes/' + paletteId + '/colours', user, {
    name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral',
  });
  const item = await callJson('POST', '/api/items', user, {
    name: 'Navy sweater', category: 'sweater', season: 'winter',
    colours: [{ hex: '#12284B', percentage: 90, isPrimary: true }],
  });
  assert.equal(item.status, 201);
  assert.ok(item.data.paletteScore >= 70);
  assert.ok(item.data.paletteVerdict === 'Perfect' || item.data.paletteVerdict === 'Strong');
  assert.equal(item.data.nearestPaletteColorName, 'Navy');
  const colours = await callJson('GET', '/api/items/' + item.data.id + '/colours', user);
  assert.equal(colours.status, 200);
  assert.equal(colours.data.data.length, 1);
});

test('api: rating concrete cases through the library', async () => {
  const rating = require('../../lib/rating.js');
  assert.equal(rating.rateItem({ primary: 'white collared shirt fixture' }).verdict, 'Strong');
  assert.equal(rating.rateItem({ primary: 'warm orange hoodie' }).verdict, 'Avoid');
  assert.equal(rating.rateItem({ primary: 'light pastel tee' }).verdict, 'Avoid');
  const navy = rating.rateItem({ primary: 'navy sweater' });
  assert.ok(navy.verdict === 'Perfect' || navy.verdict === 'Strong');
});

test('api: upload accepts WebP only and signed URL serves the file', async () => {
  const user = 'api-upload-' + Date.now();
  const base64 = Buffer.from('fake-webp-bytes').toString('base64');
  const uploaded = await callJson('POST', '/api/uploads', user, {
    contentType: 'image/webp', kind: 'image', width: 1200, height: 800, dataBase64: base64,
  });
  assert.equal(uploaded.status, 201);
  assert.ok(uploaded.data.path.startsWith('items/' + user + '/'));
  assert.equal(typeof uploaded.data.signedUrl, 'string');
  const fileResponse = await fetch(BASE + uploaded.data.signedUrl);
  assert.equal(fileResponse.status, 200);
  assert.equal(await fileResponse.text(), 'fake-webp-bytes');
  const png = await callJson('POST', '/api/uploads', user, {
    contentType: 'image/png', kind: 'image', width: 100, height: 100, dataBase64: base64,
  });
  assert.equal(png.status, 400);
});

test('api: outfit duplicate slot is 400', async () => {
  const user = 'api-outfit-' + Date.now();
  const makeItem = async (name) => {
    const created = await callJson('POST', '/api/items', user, { name, category: 'sweater', season: 'winter' });
    return created.data.id;
  };
  const a = await makeItem('Top A');
  const b = await makeItem('Top B');
  const bad = await callJson('POST', '/api/outfits', user, {
    occasion: 'daily', season: 'winter',
    items: [{ itemId: a, slot: 'base-top' }, { itemId: b, slot: 'base-top' }],
  });
  assert.equal(bad.status, 400);
  const good = await callJson('POST', '/api/outfits', user, {
    occasion: 'daily', season: 'winter',
    items: [{ itemId: a, slot: 'base-top' }, { itemId: b, slot: 'bottom' }],
  });
  assert.equal(good.status, 201);
  assert.equal(good.data.items.length, 2);
});

test('api: wear log increments wear counts', async () => {
  const user = 'api-wear-' + Date.now();
  const item = await callJson('POST', '/api/items', user, {
    name: 'Sweater', category: 'sweater', season: 'winter', price: 100,
  });
  const itemId = item.data.id;
  const outfit = await callJson('POST', '/api/outfits', user, {
    occasion: 'daily', season: 'winter', items: [{ itemId, slot: 'base-top' }],
  });
  const log = await callJson('POST', '/api/wear-logs', user, {
    outfitId: outfit.data.id, itemIds: [itemId],
  });
  assert.equal(log.status, 201);
  const after = await callJson('GET', '/api/items/' + itemId, user);
  assert.equal(after.data.wearCount, 1);
  assert.equal(after.data.costPerWear, 100);
});

test('api: advice seed is idempotent with 10 starting rules', async () => {
  const user = 'api-advice-' + Date.now();
  const first = await callJson('POST', '/api/advice-rules/seed', user);
  assert.equal(first.status, 201);
  assert.equal(first.data.seeded, true);
  assert.equal(first.data.data.length, 10);
  const second = await callJson('POST', '/api/advice-rules/seed', user);
  assert.equal(second.status, 200);
  assert.equal(second.data.seeded, false);
  assert.equal(second.data.data.length, 10);
});

test('api: palette version and rerate', async () => {
  const user = 'api-rerate-' + Date.now();
  const palette = await callJson('POST', '/api/palettes', user, { name: 'Deep Winter', isActive: true });
  const paletteId = palette.data.id;
  await callJson('POST', '/api/palettes/' + paletteId + '/colours', user, {
    name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral',
  });
  const item = await callJson('POST', '/api/items', user, {
    name: 'Navy sweater', category: 'sweater', season: 'winter',
    colours: [{ hex: '#12284B', percentage: 90, isPrimary: true }],
  });
  assert.equal(item.status, 201);
  const version = await callJson('POST', '/api/palettes/' + paletteId + '/versions', user, {});
  assert.equal(version.status, 201);
  assert.equal(version.data.version, 2);
  const rerate = await callJson('POST', '/api/palettes/' + paletteId + '/rerate', user);
  assert.equal(rerate.status, 200);
  assert.equal(rerate.data.totalCount, 1);
  assert.equal(rerate.data.reratedCount, 1);
  assert.equal(rerate.data.skippedCount, 0);
});

test('api: export returns a ZIP file', async () => {
  const user = 'api-export-' + Date.now();
  await callJson('POST', '/api/items', user, { name: 'Sweater', category: 'sweater', season: 'winter' });
  const response = await fetch(BASE + '/api/export', { method: 'POST', headers: auth(user) });
  assert.equal(response.status, 200);
  assert.ok((response.headers.get('content-type') || '').includes('application/zip'));
  const buffer = Buffer.from(await response.arrayBuffer());
  assert.equal(buffer[0], 0x50);
  assert.equal(buffer[1], 0x4B);
  assert.ok(buffer.toString('utf8').includes('items.json'));
});
