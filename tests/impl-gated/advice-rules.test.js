// Implementation-gated tests: advice rules engine, spec section 6.5, ISSUE-15 and ISSUE-18.
// Status: RED (awaiting implementation). Tests are SKIPPED until production
// code exists. Interface skeletons to be tightened through Agent D.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

let advice = null;
let missingReason = null;
try {
  advice = require('../../lib/advice-rules.js');
} catch (error) {
  missingReason = 'RED: awaiting implementation, lib/advice-rules.js does not exist yet (refs ISSUE-15, ISSUE-29)';
}

const skip = missingReason ? { skip: missingReason } : {};

test('impl advice rules: starting rules are present as editable records', skip, () => {
  assert.ok(advice, 'advice module missing');
});

test('impl advice rules: disabled rule never affects scoring', skip, () => {
  assert.ok(advice, 'advice module missing');
});

test('impl advice rules: gate state marker', () => {
  assert.equal(missingReason === null, advice !== null);
  if (missingReason) assert.ok(missingReason.startsWith('RED: awaiting implementation'));
});
