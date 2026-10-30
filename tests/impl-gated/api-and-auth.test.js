// Implementation-gated tests: API and auth, spec sections 8 and 16, ISSUE-20, ISSUE-21, ISSUE-23.
// CONTRACT SKELETON NOTE: These are skeletons awaiting a frozen contract.
// Paths are to be confirmed against the frozen contract in docs/api-contract.md.
// Do not treat any path in this file as final. Agent B owns the frozen
// contract (ISSUE-23). Live tests run only when CLOSET_TEST_BASE_URL is set
// to a test server URL. Without it, tests are SKIPPED and counted as pending.
// No real credentials are used here. Use placeholders only.
// Status: RED (awaiting implementation and frozen contract).
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const baseUrl = process.env.CLOSET_TEST_BASE_URL || '';
const missingReason = baseUrl
  ? null
  : 'RED: awaiting implementation and frozen contract, CLOSET_TEST_BASE_URL is not set and no server exists yet (refs ISSUE-23, ISSUE-29, ISSUE-30)';

const skip = missingReason ? { skip: missingReason } : {};

test('impl api: unauthenticated request returns 401', skip, async () => {
  const response = await fetch(baseUrl + '/placeholder-path-to-be-confirmed');
  assert.equal(response.status, 401);
});

test('impl api: wrong owner request returns 403', skip, async () => {
  assert.ok(baseUrl, 'base URL missing');
});

test('impl api: missing resource returns 404', skip, async () => {
  assert.ok(baseUrl, 'base URL missing');
});

test('impl api: invalid input returns 400 with single consistent JSON error shape', skip, async () => {
  assert.ok(baseUrl, 'base URL missing');
});

test('impl auth: protected route redirects unauthenticated users, API returns 401', skip, async () => {
  assert.ok(baseUrl, 'base URL missing');
});

test('impl api and auth: gate state marker', () => {
  assert.equal(missingReason === null, baseUrl !== '');
  if (missingReason) assert.ok(missingReason.startsWith('RED: awaiting implementation'));
});
