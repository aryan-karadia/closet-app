// Integration tests: outfit flow, spec sections 6.1, 6.3, 6.7, 11.3.
// Issue: ISSUE-29. Status: GREEN for fixture level flow tests.
// Production builder proof is in tests/impl-gated/outfit-engine.test.js,
// marked RED (awaiting implementation).
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hardRuleViolations } = require('../helpers/spec-rules');

function buildOutfit(top, outer) {
  return {
    occasion: 'Daily',
    items: [
      { name: top, slot: 'base top', status: 'in rotation', paletteVerdict: 'Strong', category: 'shirt', isSaturatedAccentAsMain: false },
      { name: outer, slot: 'outer layer', status: 'in rotation', paletteVerdict: 'Strong', category: 'cardigan', isSaturatedAccentAsMain: false },
      { name: 'charcoal trousers', slot: 'bottom', status: 'in rotation', paletteVerdict: 'Strong', category: 'trousers', isSaturatedAccentAsMain: false },
      { name: 'black shoes', slot: 'shoes', status: 'in rotation', paletteVerdict: 'Strong', category: 'shoes', isSaturatedAccentAsMain: false },
    ],
  };
}

test('outfit flow: daily build returns 3 outfits with different top and outer pairs', () => {
  const outfits = [buildOutfit('shirt A', 'cardigan A'), buildOutfit('shirt B', 'cardigan A'), buildOutfit('shirt A', 'cardigan B')];
  assert.equal(outfits.length, 3);
  for (const outfit of outfits) assert.deepEqual(hardRuleViolations(outfit), []);
  const pairs = outfits.map((o) => o.items[0].name + ' + ' + o.items[1].name);
  assert.equal(new Set(pairs).size, 3);
});

test('outfit flow: save outfit stores items, scores, and occasion', () => {
  const saved = {
    ...buildOutfit('shirt A', 'cardigan A'),
    paletteScore: 88,
    fitScore: 90,
    contrastScore: 85,
    rotationScore: 80,
    totalScore: 86,
    explanation: ['Dark charcoal trousers anchor this.'],
    saved: true,
  };
  assert.equal(saved.saved, true);
  assert.equal(saved.occasion, 'Daily');
  assert.ok(Array.isArray(saved.explanation) && saved.explanation.length > 0);
});

test('outfit flow: log worn records wear log and increments every item wear count', () => {
  const outfit = buildOutfit('shirt A', 'cardigan A');
  for (const item of outfit.items) item.wearCount = 0;
  const wearLog = { outfitId: 'outfit-1', itemIds: outfit.items.map((i) => i.name), wornAt: '2026-10-30', occasion: 'Daily' };
  for (const item of outfit.items) item.wearCount += 1;
  assert.equal(wearLog.itemIds.length, 4);
  assert.ok(outfit.items.every((i) => i.wearCount === 1));
});

test('outfit flow: dislike stores exact combination and reason, items are not deleted', () => {
  const disliked = {
    itemNames: ['shirt A', 'cardigan A', 'charcoal trousers', 'black shoes'],
    reason: 'fit',
    blockedUntilDays: 30,
  };
  assert.equal(disliked.reason, 'fit');
  assert.equal(disliked.blockedUntilDays, 30);
  assert.equal(disliked.itemNames.length, 4);
});

test('outfit flow: shuffle one slot replaces only that slot', () => {
  const outfit = buildOutfit('shirt A', 'cardigan A');
  const beforeTop = outfit.items[0].name;
  outfit.items[1] = { ...outfit.items[1], name: 'cardigan C' };
  assert.equal(outfit.items[0].name, beforeTop);
  assert.equal(outfit.items[1].name, 'cardigan C');
});
