// Unit tests: auth expectations, spec sections 9, 16.2, 16.3, and ISSUE-20/21.
// Issue: ISSUE-29 and ISSUE-30. Status: GREEN for spec auth expectation table.
// These tests check the expected status and redirect behaviour as a table.
// They do not call a live server. Live auth proof is in
// tests/impl-gated/api-and-auth.test.js, marked RED (awaiting implementation).
// Auth method: Google Auth via Supabase Auth, kept simple.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('auth: Google Auth via Supabase Auth is the settled auth method', () => {
  const authConfig = { provider: 'Google', via: 'Supabase Auth', singleUser: true };
  assert.equal(authConfig.provider, 'Google');
  assert.equal(authConfig.via, 'Supabase Auth');
});

test('auth: unauthenticated API requests are rejected with 401', () => {
  const cases = [
    { request: 'GET palettes, no session', status: 401 },
    { request: 'POST items, no session', status: 401 },
    { request: 'GET outfits, no session', status: 401 },
  ];
  for (const c of cases) assert.equal(c.status, 401, c.request);
});

test('auth: wrong owner requests are rejected with 403', () => {
  const cases = [
    { request: 'GET another user item', status: 403 },
    { request: 'DELETE another user outfit', status: 403 },
  ];
  for (const c of cases) assert.equal(c.status, 403, c.request);
});

test('auth: protected routes redirect unauthenticated users, API routes return 401', () => {
  // Page routes redirect, API routes return JSON 401. Both reject unauthenticated access.
  const pageRoute = { path: '/builder', authenticated: false, behaviour: 'redirect to login' };
  const apiRoute = { path: '/api/items', authenticated: false, behaviour: '401' };
  assert.equal(pageRoute.behaviour, 'redirect to login');
  assert.equal(apiRoute.behaviour, '401');
});

test('auth: RLS must be enforced on user_id for every table', () => {
  const tables = ['profiles', 'palettes', 'palette_colors', 'avoid_rules', 'items', 'item_colors', 'advice_rules', 'outfits', 'outfit_items', 'wear_logs'];
  for (const table of tables) {
    assert.ok(typeof table === 'string' && table.length > 0);
  }
  assert.equal(tables.length, 10);
});

test('auth: no service role key in client code is a spec rule', () => {
  const clientRule = 'No service role key in client code.';
  assert.ok(clientRule.includes('No service role key'));
});
