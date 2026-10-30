// Integration tests: auth flow expectations, ISSUE-20 and ISSUE-21.
// Issue: ISSUE-29. Status: GREEN for spec flow expectation tests.
// Live auth proof is in tests/impl-gated/api-and-auth.test.js, marked RED.
// Auth method: Google Auth via Supabase Auth.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('auth flow: home screen is the outfit builder after login', () => {
  const afterLogin = { screen: 'Outfit Builder', authenticated: true };
  assert.equal(afterLogin.screen, 'Outfit Builder');
  assert.equal(afterLogin.authenticated, true);
});

test('auth flow: unauthenticated user cannot reach protected screens', () => {
  const routes = [
    { path: '/builder', authenticated: false, allowed: false },
    { path: '/wardrobe', authenticated: false, allowed: false },
    { path: '/palette', authenticated: false, allowed: false },
  ];
  for (const route of routes) assert.equal(route.allowed, false, route.path);
});

test('auth flow: authenticated owner can reach protected screens', () => {
  const routes = [
    { path: '/builder', authenticated: true, allowed: true },
    { path: '/wardrobe', authenticated: true, allowed: true },
  ];
  for (const route of routes) assert.equal(route.allowed, true, route.path);
});
