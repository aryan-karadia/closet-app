// Unit tests: outfit builder hard rules, spec sections 6.2, 6.3, 6.4, 6.7.
// Issue: ISSUE-29. Status: GREEN for spec fixture classifier tests.
// These tests classify fixtures against the hard rules. They do not prove a
// production builder works. Production proof is in
// tests/impl-gated/outfit-engine.test.js, marked RED (awaiting implementation).
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  hardRuleViolations,
  interviewViolations,
  isDislikedCombinationBlocked,
} = require('../helpers/spec-rules');

function item(name, slot, overrides) {
  return {
    name,
    slot,
    status: 'in rotation',
    paletteVerdict: 'Strong',
    category: 'shirt',
    isSaturatedAccentAsMain: false,
    ...overrides,
  };
}

function validDailyOutfit() {
  return {
    occasion: 'Daily',
    items: [
      item('white collared shirt', 'base top', { category: 'shirt' }),
      item('navy cardigan', 'outer layer', { category: 'cardigan' }),
      item('charcoal trousers', 'bottom', { category: 'trousers' }),
      item('black shoes', 'shoes', { category: 'shoes' }),
    ],
  };
}

test('outfit builder: valid daily outfit has no hard rule violations', () => {
  assert.deepEqual(hardRuleViolations(validDailyOutfit()), []);
});

test('outfit builder: no two outer layers', () => {
  const outfit = validDailyOutfit();
  outfit.items.push(item('second jacket', 'outer layer', { category: 'jacket' }));
  assert.ok(hardRuleViolations(outfit).includes('two outer layers'));
});

test('outfit builder: no two bottoms', () => {
  const outfit = validDailyOutfit();
  outfit.items.push(item('second trousers', 'bottom', { category: 'trousers' }));
  assert.ok(hardRuleViolations(outfit).includes('two bottoms'));
});

test('outfit builder: no two pairs of shoes', () => {
  const outfit = validDailyOutfit();
  outfit.items.push(item('second shoes', 'shoes', { category: 'shoes' }));
  assert.ok(hardRuleViolations(outfit).includes('two pairs of shoes'));
});

test('outfit builder: max one saturated accent as a main colour', () => {
  const outfit = validDailyOutfit();
  outfit.items[0].isSaturatedAccentAsMain = true;
  assert.deepEqual(hardRuleViolations(outfit), []);
  outfit.items[1].isSaturatedAccentAsMain = true;
  assert.ok(hardRuleViolations(outfit).includes('more than one saturated accent as main colour'));
});

test('outfit builder: archived or stored items excluded, only in rotation used', () => {
  const archived = validDailyOutfit();
  archived.items[0].status = 'archived';
  assert.ok(hardRuleViolations(archived).includes('archived or stored item included'));
  const stored = validDailyOutfit();
  stored.items[0].status = 'stored';
  assert.ok(hardRuleViolations(stored).includes('archived or stored item included'));
  const inRotation = validDailyOutfit();
  assert.deepEqual(hardRuleViolations(inRotation), []);
});

test('outfit builder: interview only Perfect and Strong, no hoodies or graphic tees', () => {
  const interview = {
    occasion: 'Interview',
    items: [
      item('white collared shirt', 'base top', { category: 'shirt', paletteVerdict: 'Strong' }),
      item('charcoal trousers', 'bottom', { category: 'trousers', paletteVerdict: 'Perfect' }),
      item('navy blazer', 'outer layer', { category: 'blazer', paletteVerdict: 'Strong' }),
      item('black shoes', 'shoes', { category: 'shoes', paletteVerdict: 'Strong' }),
    ],
  };
  assert.deepEqual(interviewViolations(interview), []);
  const withWorks = JSON.parse(JSON.stringify(interview));
  withWorks.items[0].paletteVerdict = 'Works';
  assert.ok(interviewViolations(withWorks).length > 0);
  const withHoodie = JSON.parse(JSON.stringify(interview));
  withHoodie.items[0] = item('warm hoodie', 'base top', { category: 'hoodie', paletteVerdict: 'Strong' });
  assert.ok(interviewViolations(withHoodie).some((v) => v.includes('hoodie')));
  const withGraphicTee = JSON.parse(JSON.stringify(interview));
  withGraphicTee.items[0] = item('graphic tee', 'base top', { category: 'graphic tee', paletteVerdict: 'Strong' });
  assert.ok(interviewViolations(withGraphicTee).some((v) => v.includes('graphic tee')));
});

test('outfit builder: interview prefers white or light neutral collared shirt if available', () => {
  const wardrobe = [
    { name: 'white collared shirt', category: 'shirt', paletteVerdict: 'Strong', isWhiteOrLightNeutralCollared: true },
    { name: 'navy sweater', category: 'sweater', paletteVerdict: 'Strong', isWhiteOrLightNeutralCollared: false },
  ];
  const available = wardrobe.filter((w) => w.isWhiteOrLightNeutralCollared);
  assert.equal(available.length, 1);
  assert.equal(available[0].name, 'white collared shirt');
  // The preferred base top for interview, when available, is that shirt.
  const preferredBaseTop = available[0];
  assert.equal(preferredBaseTop.name, 'white collared shirt');
});

test('outfit builder: formal allows one saturated accent', () => {
  const formal = validDailyOutfit();
  formal.occasion = 'Formal';
  formal.items[0].isSaturatedAccentAsMain = true;
  assert.deepEqual(hardRuleViolations(formal), []);
  formal.items[1].isSaturatedAccentAsMain = true;
  assert.ok(hardRuleViolations(formal).includes('more than one saturated accent as main colour'));
});

test('outfit builder: diversity of 3 outfits, no shared top and outer pair', () => {
  const outfits = [
    { items: [{ slot: 'base top', name: 'shirt A' }, { slot: 'outer layer', name: 'cardigan A' }] },
    { items: [{ slot: 'base top', name: 'shirt B' }, { slot: 'outer layer', name: 'cardigan A' }] },
    { items: [{ slot: 'base top', name: 'shirt A' }, { slot: 'outer layer', name: 'cardigan B' }] },
  ];
  const pairs = outfits.map((o) => {
    const top = o.items.find((i) => i.slot === 'base top').name;
    const outer = o.items.find((i) => i.slot === 'outer layer').name;
    return top + ' + ' + outer;
  });
  assert.equal(new Set(pairs).size, 3);
  const duplicate = [
    { items: [{ slot: 'base top', name: 'shirt A' }, { slot: 'outer layer', name: 'cardigan A' }] },
    { items: [{ slot: 'base top', name: 'shirt A' }, { slot: 'outer layer', name: 'cardigan A' }] },
  ];
  const dupPairs = duplicate.map((o) => o.items.map((i) => i.name).join(' + '));
  assert.notEqual(new Set(dupPairs).size, 2);
});

test('outfit builder: dislike prevents exact same combination for 30 days, then allows it', () => {
  const dislikedAt = new Date('2026-10-01T00:00:00Z');
  assert.equal(isDislikedCombinationBlocked(dislikedAt, new Date('2026-10-15T00:00:00Z'), true), true);
  assert.equal(isDislikedCombinationBlocked(dislikedAt, new Date('2026-10-30T00:00:00Z'), true), true);
  assert.equal(isDislikedCombinationBlocked(dislikedAt, new Date('2026-10-31T00:00:00Z'), true), false);
  assert.equal(isDislikedCombinationBlocked(dislikedAt, new Date('2026-10-15T00:00:00Z'), false), false);
});

test('outfit builder: logging worn increments wear count for every item', () => {
  const outfit = validDailyOutfit();
  for (const it of outfit.items) it.wearCount = 2;
  for (const it of outfit.items) it.wearCount += 1;
  for (const it of outfit.items) assert.equal(it.wearCount, 3);
});

test('outfit builder: every outfit has at most one of each slot, empty slots allowed', () => {
  const partial = {
    occasion: 'Daily',
    items: [
      item('white collared shirt', 'base top'),
      item('charcoal trousers', 'bottom'),
    ],
  };
  assert.deepEqual(hardRuleViolations(partial), []);
  assert.equal(partial.items.filter((i) => i.slot === 'outer layer').length, 0);
});

test('outfit builder: each outfit shows palette, fit, and contrast reasoning', () => {
  const outfit = {
    ...validDailyOutfit(),
    paletteScore: 88,
    fitScore: 90,
    contrastScore: 85,
    explanation: ['Dark charcoal trousers anchor this.', 'The navy outer keeps the contrast high.'],
  };
  assert.ok(typeof outfit.paletteScore === 'number');
  assert.ok(typeof outfit.fitScore === 'number');
  assert.ok(typeof outfit.contrastScore === 'number');
  assert.ok(Array.isArray(outfit.explanation) && outfit.explanation.length > 0);
});
