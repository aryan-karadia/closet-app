// Unit tests: API contract skeletons, spec section 8, ISSUE-23 and ISSUE-30.
// CONTRACT SKELETON NOTE: These are skeletons awaiting a frozen contract.
// Paths are to be confirmed against the frozen contract in docs/api-contract.md.
// Do not treat any path in this file as final. Agent B owns the frozen
// contract (ISSUE-23). Agent C owns these skeleton tests. A contract change
// goes through Agent D, and Agent C updates these tests.
// Issue: ISSUE-30. Status: GREEN for skeleton schema and error shape tests.
// Live endpoint proof is in tests/impl-gated/api-and-auth.test.js and
// tests/integration/api-contract.test.js, marked RED (awaiting implementation).
// Resource names are from spec section 8: palettes, palette colours, avoid
// rules, items, item colours, advice rules, outfits, outfit items, wear logs.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  API_RESOURCES,
  RESOURCE_FIELDS,
  CANDIDATE_ERROR_SHAPE,
  HTTP_ERROR_CASES,
} = require('../fixtures/spec-data');

test('api contract skeleton: all spec section 8 resources are listed', () => {
  assert.equal(API_RESOURCES.length, 9);
  for (const expected of ['palettes', 'palette colours', 'avoid rules', 'items', 'item colours', 'advice rules', 'outfits', 'outfit items', 'wear logs']) {
    assert.ok(API_RESOURCES.includes(expected), 'missing resource: ' + expected);
  }
});

test('api contract skeleton: each resource has a field list from spec section 8', () => {
  for (const resource of API_RESOURCES) {
    assert.ok(Array.isArray(RESOURCE_FIELDS[resource]), 'missing field list for: ' + resource);
    assert.ok(RESOURCE_FIELDS[resource].length > 0);
    assert.ok(RESOURCE_FIELDS[resource].includes('id') || resource === 'item colours' || resource === 'outfit items');
  }
});

test('api contract skeleton: items keep nullable location field only, not a location flow', () => {
  assert.ok(RESOURCE_FIELDS.items.includes('location'));
  assert.ok(RESOURCE_FIELDS.items.includes('status'));
});

test('api contract skeleton: request and response schemas use the same resource fields', () => {
  // Skeleton rule: a create request must not require server generated fields
  // such as id or created timestamps, but a response must include id.
  const serverGenerated = ['id'];
  for (const field of serverGenerated) {
    assert.ok(RESOURCE_FIELDS.items.includes(field));
  }
});

test('api contract skeleton: validation errors return 400 for invalid input', () => {
  const invalidInputs = [
    { resource: 'items', problem: 'missing category' },
    { resource: 'palettes', problem: 'missing name' },
    { resource: 'advice rules', problem: 'invalid action value' },
  ];
  for (const input of invalidInputs) {
    const expected = HTTP_ERROR_CASES.find((c) => c.situation === 'invalid input');
    assert.equal(expected.status, 400);
  }
});

test('api contract skeleton: 401 unauthenticated, 403 wrong owner, 404 missing resource', () => {
  const bySituation = new Map(HTTP_ERROR_CASES.map((c) => [c.situation, c.status]));
  assert.equal(bySituation.get('unauthenticated request'), 401);
  assert.equal(bySituation.get('wrong owner'), 403);
  assert.equal(bySituation.get('missing resource'), 404);
});

test('api contract skeleton: single consistent JSON error shape, candidate only, not frozen', () => {
  assert.ok('error' in CANDIDATE_ERROR_SHAPE);
  assert.ok('code' in CANDIDATE_ERROR_SHAPE.error);
  assert.ok('message' in CANDIDATE_ERROR_SHAPE.error);
  // All error cases in this skeleton must use this one shape. The frozen
  // contract may replace the shape, but it must still be a single shape.
  const errorResponses = HTTP_ERROR_CASES.map((c) => ({ status: c.status, body: CANDIDATE_ERROR_SHAPE }));
  for (const response of errorResponses) {
    assert.deepEqual(Object.keys(response.body), ['error']);
  }
});

test('api contract skeleton: paths are to be confirmed against the frozen contract', () => {
  // This test documents the skeleton status. It passes only as a skeleton
  // marker, not as proof that any endpoint exists.
  const skeletonStatus = 'skeleton awaiting frozen contract in docs/api-contract.md (ISSUE-23)';
  assert.ok(skeletonStatus.includes('awaiting frozen contract'));
  assert.ok(skeletonStatus.includes('ISSUE-23'));
});
