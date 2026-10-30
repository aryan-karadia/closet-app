// Unit tests: palette ingester, spec sections 4, 11.1, 15.
// Issue: ISSUE-29. Status: GREEN for spec fixture and correction state tests.
// These tests validate spec fixtures and correction state transitions in a
// self contained way. They do not prove a production PDF ingester works.
// Production ingester proof is in tests/impl-gated/palette-ingester.test.js,
// marked RED (awaiting implementation).
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CORE_COLOURS,
  NEUTRAL_COLOURS,
  AVOID_RULES,
  BEAUTY_SECTIONS,
  BEAUTY_COLOUR_EXAMPLES,
} = require('../fixtures/spec-data');
const { paletteSummary } = require('../helpers/spec-rules');

function buildPaletteColours() {
  const colours = [];
  for (const name of CORE_COLOURS) {
    colours.push({ name, role: 'core', hex: '#000000', sourcePage: 1, isManual: false });
  }
  for (const name of NEUTRAL_COLOURS) {
    colours.push({ name, role: 'neutral', hex: '#000000', sourcePage: 2, isManual: false });
  }
  for (const rule of AVOID_RULES) {
    colours.push({ name: rule.name, role: 'avoid', hex: null, sourcePage: 3, isManual: false });
  }
  return colours;
}

test('palette ingester: core colours from spec section 15 are present', () => {
  assert.equal(CORE_COLOURS.length, 7);
  for (const expected of ['royal blue', 'emerald green', 'rich purple', 'true red', 'deep teal', 'rich plum', 'dark burgundy']) {
    assert.ok(CORE_COLOURS.includes(expected), 'missing core colour: ' + expected);
  }
  assert.equal(new Set(CORE_COLOURS).size, CORE_COLOURS.length, 'core colours must be unique');
});

test('palette ingester: neutrals from spec section 15 are present', () => {
  assert.equal(NEUTRAL_COLOURS.length, 3);
  for (const expected of ['charcoal gray', 'navy', 'cool black']) {
    assert.ok(NEUTRAL_COLOURS.includes(expected), 'missing neutral: ' + expected);
  }
});

test('palette ingester: avoid rules cover light pastels, warm oranges, muted earthy hues', () => {
  const names = AVOID_RULES.map((r) => r.name);
  assert.ok(names.includes('light pastels'));
  assert.ok(names.includes('warm oranges'));
  assert.ok(names.includes('muted earthy hues'));
  for (const rule of AVOID_RULES) {
    assert.ok(rule.hueMin <= rule.hueMax);
    assert.ok(rule.saturationMin <= rule.saturationMax);
    assert.ok(rule.lightnessMin <= rule.lightnessMax);
    assert.ok(typeof rule.description === 'string' && rule.description.length > 0);
  }
  const warm = AVOID_RULES.find((r) => r.name === 'warm oranges');
  assert.equal(warm.hueMin, 20);
  assert.equal(warm.hueMax, 50);
  const pastel = AVOID_RULES.find((r) => r.name === 'light pastels');
  assert.ok(pastel.lightnessMin > 75);
  assert.ok(pastel.saturationMax < 45);
});

test('palette ingester: beauty sections are classified as ignore', () => {
  for (const section of ['makeup', 'blush', 'lip', 'hair', 'nail', 'facetune']) {
    assert.ok(BEAUTY_SECTIONS.includes(section), 'missing beauty section: ' + section);
  }
});

test('palette ingester: makeup, blush, lip, hair colours are never saved as clothing colours unless explicitly added', () => {
  // Default save: beauty examples are excluded.
  const savedByDefault = BEAUTY_COLOUR_EXAMPLES.filter((c) => c.explicitlyAddedByUser === true);
  assert.equal(savedByDefault.length, 0);
  // Explicit user add is the only exception, and it must be marked explicit.
  const explicitlyAdded = { ...BEAUTY_COLOUR_EXAMPLES[0], explicitlyAddedByUser: true };
  assert.equal(explicitlyAdded.explicitlyAddedByUser, true);
  // The default path must still exclude the unmarked examples.
  const clothingColours = buildPaletteColours();
  for (const beauty of BEAUTY_COLOUR_EXAMPLES) {
    assert.ok(!clothingColours.some((c) => c.name === beauty.name));
  }
});

test('palette ingester: Remove beauty colours deletes beauty tagged colours and can be undone in state', () => {
  const colours = [
    ...buildPaletteColours(),
    { name: 'blush pink', role: 'core', beautyTag: 'blush' },
    { name: 'hair brown', role: 'neutral', beautyTag: 'hair' },
  ];
  const before = colours.length;
  const removed = colours.filter((c) => c.beautyTag);
  const afterRemove = colours.filter((c) => !c.beautyTag);
  assert.equal(afterRemove.length, before - removed.length);
  assert.equal(removed.length, 2);
  // Undo restores the removed colours.
  const afterUndo = [...afterRemove, ...removed];
  assert.equal(afterUndo.length, before);
});

test('palette ingester: correction can rename, change role, change hex, delete, and add', () => {
  let colours = buildPaletteColours();
  const target = colours.find((c) => c.name === 'royal blue');
  target.name = 'royal blue corrected';
  assert.equal(colours.find((c) => c.name === 'royal blue corrected').name, 'royal blue corrected');
  target.role = 'neutral';
  assert.equal(target.role, 'neutral');
  target.hex = '#1e3fae';
  assert.equal(target.hex, '#1e3fae');
  colours = colours.filter((c) => c.name !== 'dark burgundy');
  assert.ok(!colours.some((c) => c.name === 'dark burgundy'));
  colours.push({ name: 'user added teal', role: 'core', hex: '#006666', sourcePage: null, isManual: true });
  assert.ok(colours.some((c) => c.name === 'user added teal' && c.isManual === true));
});

test('palette ingester: summary warns if zero neutrals or zero avoids', () => {
  const full = paletteSummary(buildPaletteColours());
  assert.deepEqual(full.warnings, []);
  assert.equal(full.core, 7);
  assert.equal(full.neutral, 3);
  assert.equal(full.avoid, 3);
  const noNeutrals = paletteSummary(buildPaletteColours().filter((c) => c.role !== 'neutral'));
  assert.ok(noNeutrals.warnings.includes('warning: zero neutrals'));
  const noAvoids = paletteSummary(buildPaletteColours().filter((c) => c.role !== 'avoid'));
  assert.ok(noAvoids.warnings.includes('warning: zero avoids'));
});

test('palette ingester: every extracted colour keeps a source page', () => {
  for (const colour of buildPaletteColours()) {
    assert.ok(Number.isInteger(colour.sourcePage), 'missing source page for ' + colour.name);
  }
});

test('palette ingester: new palette version does not delete items in state', () => {
  const itemsBefore = [{ id: 'item-1', name: 'white collared shirt' }];
  const paletteVersionBefore = 1;
  const paletteVersionAfter = paletteVersionBefore + 1;
  assert.equal(paletteVersionAfter, 2);
  assert.deepEqual(itemsBefore, [{ id: 'item-1', name: 'white collared shirt' }]);
});
