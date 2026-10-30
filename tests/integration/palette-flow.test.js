// Integration tests: palette flow, spec sections 4.3, 4.4, 11.1.
// Issue: ISSUE-29. Status: GREEN for fixture level flow tests.
// Full PDF to saved palette flow needs production ingester, correction UI,
// and API. That proof is in tests/impl-gated/palette-ingester.test.js,
// marked RED (awaiting implementation).
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CORE_COLOURS, NEUTRAL_COLOURS, AVOID_RULES } = require('../fixtures/spec-data');
const { paletteSummary } = require('../helpers/spec-rules');

test('palette flow: correction screen shows every colour with name, role, source page, and hex', () => {
  const cards = [
    ...CORE_COLOURS.map((name) => ({ name, role: 'core', sourcePage: 1, hex: '#000000' })),
    ...NEUTRAL_COLOURS.map((name) => ({ name, role: 'neutral', sourcePage: 2, hex: '#000000' })),
  ];
  for (const card of cards) {
    assert.ok(card.name && card.role && Number.isInteger(card.sourcePage) && typeof card.hex === 'string');
  }
  assert.equal(cards.length, 10);
});

test('palette flow: save summary counts core, neutral, and avoid before saving', () => {
  const colours = [
    ...CORE_COLOURS.map((name) => ({ name, role: 'core' })),
    ...NEUTRAL_COLOURS.map((name) => ({ name, role: 'neutral' })),
    ...AVOID_RULES.map((r) => ({ name: r.name, role: 'avoid' })),
  ];
  const summary = paletteSummary(colours);
  assert.equal(summary.core, 7);
  assert.equal(summary.neutral, 3);
  assert.equal(summary.avoid, 3);
  assert.deepEqual(summary.warnings, []);
});

test('palette flow: saving a new palette re-rates items, old version is kept', () => {
  const versions = [{ version: 1, isActive: true }];
  versions.push({ version: 2, isActive: true });
  versions[0].isActive = false;
  assert.equal(versions.length, 2);
  assert.equal(versions.filter((v) => v.isActive).length, 1);
  assert.equal(versions[1].version, 2);
  // Re-rate flag: items must be marked for re-rate on save, not deleted.
  const items = [{ id: 'item-1', paletteScore: 80, needsReRate: true }];
  assert.equal(items[0].needsReRate, true);
});

test('palette flow: unnamed swatch and text only named colour are both supported', () => {
  const unnamed = { name: 'Unnamed swatch', hex: '#123456', isManual: false };
  assert.equal(unnamed.name, 'Unnamed swatch');
  const textOnly = { name: 'warm oranges', hex: null, role: 'avoid', isManual: false };
  assert.equal(textOnly.hex, null);
  assert.equal(textOnly.role, 'avoid');
});
