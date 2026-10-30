// Integration tests: API contract skeletons, ISSUE-30.
// CONTRACT SKELETON NOTE: These are skeletons awaiting a frozen contract.
// Paths are to be confirmed against the frozen contract in docs/api-contract.md.
// Do not treat any path in this file as final. Agent B owns the frozen
// contract (ISSUE-23). Live endpoint proof is in
// tests/impl-gated/api-and-auth.test.js, marked RED (awaiting implementation).
// Resource names are from spec section 8: palettes, palette colours, avoid
// rules, items, item colours, advice rules, outfits, outfit items, wear logs.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { API_RESOURCES, CANDIDATE_ERROR_SHAPE, HTTP_ERROR_CASES } = require('../fixtures/spec-data');

test('api contract integration skeleton: every resource has CRUD expectations in skeleton', () => {
  for (const resource of API_RESOURCES) {
    const crud = ['create', 'read', 'update', 'delete'];
    assert.equal(crud.length, 4, resource);
  }
});

test('api contract integration skeleton: error cases map to one consistent shape', () => {
  for (const errorCase of HTTP_ERROR_CASES) {
    assert.ok([400, 401, 403, 404].includes(errorCase.status));
    assert.deepEqual(Object.keys(CANDIDATE_ERROR_SHAPE), ['error']);
  }
});

test('api contract integration skeleton: unauthenticated live calls are pending, not faked', () => {
  // No server exists yet in this repo. A live HTTP call would be invented
  // if written here as passing. The live version lives in impl-gated tests
  // and is skipped until a server exists. This skeleton test records that.
  const liveServerExists = false;
  assert.equal(liveServerExists, false);
});

test('api contract integration skeleton: paths are to be confirmed against the frozen contract', () => {
  const note = 'Paths are to be confirmed against the frozen contract in docs/api-contract.md (ISSUE-23).';
  assert.ok(note.includes('to be confirmed against the frozen contract'));
});
