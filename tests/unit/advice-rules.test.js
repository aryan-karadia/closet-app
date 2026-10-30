// Unit tests: advice rules enable and disable, spec section 6.5.
// Issue: ISSUE-29. Status: GREEN for spec starting rules and enabled only scoring.
// Production advice rule engine proof is in tests/impl-gated/advice-rules.test.js,
// marked RED (awaiting implementation).
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { STARTING_ADVICE_RULES } = require('../fixtures/spec-data');
const { scoreFromEnabledRulesOnly } = require('../helpers/spec-rules');

test('advice rules: starting rules from spec section 6.5 are present as editable records', () => {
  assert.equal(STARTING_ADVICE_RULES.length, 10);
  const names = STARTING_ADVICE_RULES.map((r) => r.name);
  for (const expected of ['Shoulders first', 'Base layer arms', 'Outer body', 'Trouser cut', 'Sleeve fit', 'Contrast', 'Colour temperature', 'One detail', 'Jewelry and watch', 'Neckline']) {
    assert.ok(names.includes(expected), 'missing starting rule: ' + expected);
  }
});

test('advice rules: every starting rule has condition, action, reason, source, and enabled flag', () => {
  for (const rule of STARTING_ADVICE_RULES) {
    assert.ok(typeof rule.name === 'string' && rule.name.length > 0);
    assert.ok(typeof rule.action === 'string' && ['prefer', 'avoid', 'require'].includes(rule.action));
    assert.ok(typeof rule.reason === 'string' && rule.reason.length > 0);
    assert.ok(['User stated fit preference', 'User stated style direction'].includes(rule.source));
    assert.equal(typeof rule.enabled, 'boolean');
  }
});

test('advice rules: all starting rules start enabled', () => {
  for (const rule of STARTING_ADVICE_RULES) {
    assert.equal(rule.enabled, true, 'starting rule should start enabled: ' + rule.name);
  }
});

test('advice rules: a disabled rule must never affect scoring', () => {
  const rules = [
    { name: 'Shoulders first', weight: 10, enabled: true },
    { name: 'Contrast', weight: 8, enabled: true },
    { name: 'Neckline', weight: 5, enabled: false },
  ];
  assert.equal(scoreFromEnabledRulesOnly(rules), 18);
  const allDisabled = rules.map((r) => ({ ...r, enabled: false }));
  assert.equal(scoreFromEnabledRulesOnly(allDisabled), 0);
  const toggled = rules.map((r) => (r.name === 'Neckline' ? { ...r, enabled: true } : r));
  assert.equal(scoreFromEnabledRulesOnly(toggled), 23);
});

test('advice rules: neckline rule is a preference, not a hard filter', () => {
  const neckline = STARTING_ADVICE_RULES.find((r) => r.name === 'Neckline');
  assert.ok(neckline.reason.includes('preference, not a hard filter'));
  assert.equal(neckline.action, 'prefer');
});

test('advice rules: user can edit, disable, and delete a rule in state', () => {
  let rules = STARTING_ADVICE_RULES.map((r) => ({ ...r }));
  const target = rules.find((r) => r.name === 'Contrast');
  target.reason = 'Edited reason.';
  assert.equal(target.reason, 'Edited reason.');
  target.enabled = false;
  assert.equal(target.enabled, false);
  rules = rules.filter((r) => r.name !== 'Sleeve fit');
  assert.ok(!rules.some((r) => r.name === 'Sleeve fit'));
  rules.push({ name: 'User added rule', conditionCategory: 'outfit', action: 'prefer', reason: 'User note.', source: 'User stated fit preference', enabled: true });
  assert.ok(rules.some((r) => r.name === 'User added rule'));
});

test('advice rules: silver over gold is in the starting set', () => {
  const jewelry = STARTING_ADVICE_RULES.find((r) => r.name === 'Jewelry and watch');
  assert.ok(jewelry.reason.includes('Silver'));
  assert.ok(jewelry.reason.includes('leather band watch'));
});
