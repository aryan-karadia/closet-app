// Implementation-gated tests: palette ingester, spec section 4, ISSUE-03 and ISSUE-04.
// Status: RED (awaiting implementation). Tests are SKIPPED until production
// code exists. Production function signatures are not yet defined, so these
// are interface skeletons to be tightened through Agent D. See TEST-PLAN Blocked.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

let ingester = null;
let missingReason = null;
try {
  ingester = require('../../lib/palette-ingester.js');
} catch (error) {
  missingReason = 'RED: awaiting implementation, lib/palette-ingester.js does not exist yet (refs ISSUE-03, ISSUE-29)';
}

const skip = missingReason ? { skip: missingReason } : {};

test('impl palette ingester: extracts core, neutral, and avoid sections from a PDF', skip, () => {
  assert.ok(ingester, 'ingester module missing');
});

test('impl palette ingester: never saves makeup, blush, lip, or hair colours unless explicitly added', skip, () => {
  assert.ok(ingester, 'ingester module missing');
});

test('impl palette ingester: correction and Remove beauty colours are supported', skip, () => {
  assert.ok(ingester, 'ingester module missing');
});

test('impl palette ingester: gate state marker', () => {
  assert.equal(missingReason === null, ingester !== null);
  if (missingReason) assert.ok(missingReason.startsWith('RED: awaiting implementation'));
});
