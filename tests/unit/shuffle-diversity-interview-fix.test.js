// Spec level tests for the ISSUE-32, ISSUE-33, and ISSUE-34 fix run.
// Refs: ISSUE-32, ISSUE-33, ISSUE-34, spec sections 6.1, 6.2, 6.3, 6.4.
// Status: GREEN for the spec oracle in this file. This file defines the
// rules a correct shuffle, diversity fill, and interview unrated build
// must satisfy. It does not prove the React shuffle button works, because
// shuffleSlot lives in app/page.tsx and cannot be executed by node:test.
// Production engine proof is in tests/impl-gated/fix-ISSUE-32-33-34.test.js.
// The shuffle oracle below uses production classification helpers
// (slotForCategory, isSaturatedAccent, isDisliked) from
// lib/outfit-engine/index.js, so a change to those helpers changes these
// results, but the selection rule itself (reject a violating candidate,
// replace it with the highest scoring valid alternative, replace only
// that slot, keep the original when no valid alternative exists) is the
// spec rule from ISSUE-32, restated here for the oracle.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../lib/outfit-engine/index.js');

const WARNING = 'Unrated item included, palette fit not verified';

function item(id, name, category, hex, verdict, score, extra) {
  return Object.assign({
    id, name, category, primaryColorHex: hex, paletteVerdict: verdict,
    paletteScore: score, status: 'in rotation', season: 'all-season',
    fitTags: [], wearCount: 0,
  }, extra || {});
}

function outfitEntry(entryItem, slot) {
  return { itemId: entryItem.id, slot, item: entryItem };
}

// Shuffle oracle, spec 6.1 and ISSUE-32. A shuffled outfit must satisfy
// the same hard rules as a fresh build: at most one saturated accent
// as a main colour for daily (none for interview), no Avoid item, no
// interview excluded category, no disliked combination, only in
// rotation items, and only that slot changes.
function shuffleSlotSpec(outfit, slot, alternatives, context) {
  const occasion = (context && context.occasion) || 'daily';
  const disliked = (context && context.disliked) || [];
  const now = (context && context.now) || null;
  const current = outfit.items.find((x) => x.slot === slot);
  const kept = outfit.items.filter((x) => x.slot !== slot);
  const valid = alternatives.filter((candidate) => {
    if (engine.slotForCategory(candidate.category, candidate.name) !== slot) return false;
    if (candidate.status !== 'in rotation') return false;
    if (current && candidate.id === current.itemId) return false;
    if (candidate.paletteVerdict === 'Avoid') return false;
    if (candidate.paletteVerdict === 'Works') {
      if (occasion === 'interview') return false;
    }
    if (occasion === 'interview') {
      const haystack = (String(candidate.category || '') + ' ' + String(candidate.name || '')).toLowerCase();
      if (haystack.includes('hoodie') || haystack.includes('graphic tee')) return false;
      if (candidate.paletteVerdict !== null && candidate.paletteVerdict !== undefined
        && candidate.paletteVerdict !== 'Perfect' && candidate.paletteVerdict !== 'Strong') return false;
    }
    const trial = kept.concat([{ itemId: candidate.id, slot, item: candidate }]);
    const mains = trial.filter((x) => ['base-top', 'outer-layer', 'accessory'].includes(x.slot)).map((x) => x.item);
    const accents = mains.filter((entryItem) => engine.isSaturatedAccent(entryItem)).length;
    if (occasion === 'interview' && accents > 0) return false;
    if (accents > 1) return false;
    if (engine.isDisliked(trial.map((x) => x.itemId), disliked, now)) return false;
    return true;
  });
  if (!valid.length) {
    return { outfit, message: 'No valid alternative available for this slot.' };
  }
  // Rated items first for interview: an unrated candidate is a fallback
  // only, never chosen while a rated valid alternative exists.
  let pool = valid;
  if (occasion === 'interview') {
    const rated = valid.filter((candidate) => candidate.paletteVerdict === 'Perfect' || candidate.paletteVerdict === 'Strong');
    if (rated.length) pool = rated;
  }
  const replacement = [...pool].sort((a, b) => (b.paletteScore || 0) - (a.paletteScore || 0))[0];
  const newItems = outfit.items.map((x) => (x.slot === slot ? { itemId: replacement.id, slot, item: replacement } : x));
  const result = { items: newItems, message: '' };
  if (replacement.paletteVerdict === null || replacement.paletteVerdict === undefined) {
    result.warning = WARNING;
    result.explanation = [WARNING];
  }
  return result;
}

function dailyOutfitWithAccentTop() {
  return {
    occasion: 'daily',
    items: [
      outfitEntry(item('t1', 'Emerald knit', 'knit', '#046A38', 'Perfect', 95), 'base-top'),
      outfitEntry(item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93), 'outer-layer'),
      outfitEntry(item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95), 'bottom'),
      outfitEntry(item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
      ),
    ],
  };
}

test('shuffle fix ISSUE-32: a would-be second saturated accent is rejected and replaced with a valid alternative', () => {
  const outfit = dailyOutfitWithAccentTop();
  assert.equal(engine.isSaturatedAccent(outfit.items[0].item), true, 'fixture top must be a saturated accent');
  const alternatives = [
    item('o2', 'Royal blue jacket', 'jacket', '#4169E1', 'Perfect', 99),
    item('o3', 'Charcoal cardigan', 'cardigan', '#36454F', 'Strong', 80),
  ];
  assert.equal(engine.isSaturatedAccent(alternatives[0]), true, 'fixture alternative must be a second saturated accent');
  const result = shuffleSlotSpec(outfit, 'outer-layer', alternatives, { occasion: 'daily' });
  const outer = result.outfit ? result.outfit.items.find((x) => x.slot === 'outer-layer') : result.items.find((x) => x.slot === 'outer-layer');
  assert.equal(outer.itemId, 'o3', 'shuffle must not pick the second saturated accent');
  assert.equal(result.items.find((x) => x.slot === 'base-top').itemId, 't1', 'shuffle must replace only the outer slot');
});

test('shuffle fix ISSUE-32: an interview excluded category is rejected and replaced with a valid alternative', () => {
  const outfit = {
    occasion: 'interview',
    items: [
      outfitEntry(item('w1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'),
      outfitEntry(item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93), 'outer-layer'),
      outfitEntry(item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95), 'bottom'),
      outfitEntry(item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96)),
    ],
  };
  const alternatives = [
    item('h1', 'Warm orange hoodie', 'hoodie', '#E86A1F', 'Perfect', 99),
    item('g1', 'Graphic tee', 'graphic tee', '#FFFFFF', 'Perfect', 98),
    item('n1', 'Navy sweater', 'sweater', '#12284B', 'Perfect', 90),
  ];
  const result = shuffleSlotSpec(outfit, 'base-top', alternatives, { occasion: 'interview' });
  assert.equal(result.items.find((x) => x.slot === 'base-top').itemId, 'n1', 'shuffle must not pick a hoodie or graphic tee for interview');
  assert.equal(result.items.find((x) => x.slot === 'outer-layer').itemId, 'o1', 'shuffle must replace only the base top slot');
});

test('shuffle fix ISSUE-32: an Avoid verdict alternative is rejected and replaced with a valid alternative', () => {
  const outfit = dailyOutfitWithAccentTop();
  const alternatives = [
    item('o2', 'Warm orange jacket', 'jacket', '#E86A1F', 'Avoid', 99),
    item('o3', 'Charcoal cardigan', 'cardigan', '#36454F', 'Strong', 80),
  ];
  const result = shuffleSlotSpec(outfit, 'outer-layer', alternatives, { occasion: 'daily' });
  assert.equal(result.items.find((x) => x.slot === 'outer-layer').itemId, 'o3', 'shuffle must not pick an Avoid item');
});

test('shuffle fix ISSUE-32: a disliked combination is rejected and replaced with a valid alternative', () => {
  const outfit = dailyOutfitWithAccentTop();
  const disliked = [{ ids: ['t1', 'o2', 'b1', 's1'], dislikedAt: new Date().toISOString() }];
  const alternatives = [
    item('o2', 'Navy cardigan', 'cardigan', '#12284B', 'Perfect', 99),
    item('o3', 'Charcoal cardigan', 'cardigan', '#36454F', 'Strong', 80),
  ];
  const result = shuffleSlotSpec(outfit, 'outer-layer', alternatives, { occasion: 'daily', disliked });
  assert.equal(result.items.find((x) => x.slot === 'outer-layer').itemId, 'o3', 'shuffle must not recreate a disliked combination');
});

test('shuffle fix ISSUE-32: shuffle replaces only that slot, other items are unchanged', () => {
  const outfit = dailyOutfitWithAccentTop();
  const before = outfit.items.map((x) => x.itemId);
  const result = shuffleSlotSpec(outfit, 'outer-layer', [
    item('o3', 'Charcoal cardigan', 'cardigan', '#36454F', 'Strong', 80),
  ], { occasion: 'daily' });
  const after = result.items.map((x) => x.itemId);
  assert.equal(after[0], before[0]);
  assert.equal(after[2], before[2]);
  assert.equal(after[3], before[3]);
  assert.notEqual(after[1], before[1]);
});

test('shuffle fix ISSUE-32: when no valid alternative exists, the original outfit is kept with a message', () => {
  const outfit = dailyOutfitWithAccentTop();
  const result = shuffleSlotSpec(outfit, 'outer-layer', [
    item('o2', 'Royal blue jacket', 'jacket', '#4169E1', 'Perfect', 99),
  ], { occasion: 'daily' });
  assert.deepEqual(result.outfit.items.map((x) => x.itemId), outfit.items.map((x) => x.itemId));
  assert.ok(typeof result.message === 'string' && result.message.length > 0, 'no valid alternative must be reported, not silent');
});

test('shuffle fix ISSUE-32 and ISSUE-34: an unrated interview alternative is a fallback only, with a warning', () => {
  const outfit = {
    occasion: 'interview',
    items: [
      outfitEntry(item('w1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'),
      outfitEntry(item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93), 'outer-layer'),
      outfitEntry(item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95), 'bottom'),
      outfitEntry(item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96)),
    ],
  };
  const ratedFirst = shuffleSlotSpec(outfit, 'base-top', [
    item('u1', 'Unrated navy sweater', 'sweater', '#12284B', null, 99),
    item('n1', 'Navy sweater', 'sweater', '#12284B', 'Perfect', 90),
  ], { occasion: 'interview' });
  assert.equal(ratedFirst.items.find((x) => x.slot === 'base-top').itemId, 'n1', 'a rated valid alternative must win over an unrated one');
  const fallbackOnly = shuffleSlotSpec(outfit, 'base-top', [
    item('u1', 'Unrated navy sweater', 'sweater', '#12284B', null, 99),
  ], { occasion: 'interview' });
  assert.equal(fallbackOnly.items.find((x) => x.slot === 'base-top').itemId, 'u1', 'unrated is allowed only as a fallback');
  assert.equal(fallbackOnly.warning, WARNING);
  assert.ok(fallbackOnly.explanation.includes(WARNING), 'fallback warning must appear in the explanation');
});

// Diversity oracle, spec 6.3 step 4 variety and ISSUE-33. A valid
// diversity result has distinct top and outer pairs only, and if it
// has fewer than 3 outfits, it carries a message about the shortfall.
function diversityResultIsValid(outfits, message) {
  const pairs = outfits.map((o) => {
    const top = (o.items.find((x) => x.slot === 'base-top') || {}).itemId || 'none';
    const outer = (o.items.find((x) => x.slot === 'outer-layer') || {}).itemId || 'none';
    return top + '|' + outer;
  });
  if (new Set(pairs).size !== pairs.length) return false;
  if (outfits.length < 3 && !(typeof message === 'string' && message.length > 0)) return false;
  return true;
}

test('diversity fix ISSUE-33: three outfits with distinct top and outer pairs are valid', () => {
  const outfits = [
    { items: [outfitEntry(item('t1', 'Shirt A', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'), outfitEntry(item('o1', 'Cardigan A', 'cardigan', '#36454F', 'Strong', 85), 'outer-layer')] },
    { items: [outfitEntry(item('t2', 'Shirt B', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'), outfitEntry(item('o1', 'Cardigan A', 'cardigan', '#36454F', 'Strong', 85), 'outer-layer')] },
    { items: [outfitEntry(item('t1', 'Shirt A', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'), outfitEntry(item('o2', 'Cardigan B', 'cardigan', '#36454F', 'Strong', 85), 'outer-layer')] },
  ];
  assert.equal(diversityResultIsValid(outfits, ''), true);
});

test('diversity fix ISSUE-33: a small wardrobe result with fewer outfits is valid only with a message', () => {
  const outfits = [
    { items: [outfitEntry(item('t1', 'Shirt A', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'), outfitEntry(item('o1', 'Cardigan A', 'cardigan', '#36454F', 'Strong', 85), 'outer-layer')] },
  ];
  assert.equal(diversityResultIsValid(outfits, ''), false, 'fewer outfits without a message is a silent shortfall');
  assert.equal(diversityResultIsValid(outfits, 'Only 1 distinct top and outer pair is available in this wardrobe.'), true);
});

test('diversity fix ISSUE-33: repeated top and outer pairs are never valid, even with a message', () => {
  const outfits = [
    { items: [outfitEntry(item('t1', 'Shirt A', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'), outfitEntry(item('o1', 'Cardigan A', 'cardigan', '#36454F', 'Strong', 85), 'outer-layer')] },
    { items: [outfitEntry(item('t1', 'Shirt A', 'shirt', '#FFFFFF', 'Strong', 85), 'base-top'), outfitEntry(item('o1', 'Cardigan A', 'cardigan', '#36454F', 'Strong', 85), 'outer-layer')] },
  ];
  assert.equal(diversityResultIsValid(outfits, 'Only 1 distinct pair is available.'), false, 'a message does not excuse a repeated pair');
});

// Interview unrated oracle, ISSUE-34 decision recorded 2026-10-30.
// Perfect and Strong first, unrated only as a fallback with the warning
// in both the card and the explanation, Avoid and excluded categories
// still rejected, and an all-unrated outfit is never marked verified.
function interviewUnratedResultIsValid(outfits) {
  let seenUnratedOutfit = false;
  for (const outfit of outfits) {
    const hasUnrated = outfit.items.some((x) => x.item.paletteVerdict === null || x.item.paletteVerdict === undefined);
    const hasAvoid = outfit.items.some((x) => x.item.paletteVerdict === 'Avoid' || x.item.paletteVerdict === 'Works');
    const hasExcluded = outfit.items.some((x) => {
      const haystack = (String(x.item.category || '') + ' ' + String(x.item.name || '')).toLowerCase();
      return haystack.includes('hoodie') || haystack.includes('graphic tee');
    });
    if (hasAvoid || hasExcluded) return false;
    if (hasUnrated) {
      seenUnratedOutfit = true;
      const cardWarns = Array.isArray(outfit.cardWarnings) && outfit.cardWarnings.includes(WARNING);
      const explanationWarns = Array.isArray(outfit.explanation) && outfit.explanation.includes(WARNING);
      if (!cardWarns || !explanationWarns) return false;
      if (outfit.verified === true) return false;
      for (const entry of outfit.items) {
        if ((entry.item.paletteVerdict === null || entry.item.paletteVerdict === undefined)
          && !(Array.isArray(entry.warnings) && entry.warnings.includes(WARNING))) return false;
      }
    }
    if (outfit.items.every((x) => x.item.paletteVerdict === null || x.item.paletteVerdict === undefined)
      && outfit.verified === true) return false;
  }
  // Rated outfits must come before any unrated outfit when both exist.
  if (seenUnratedOutfit) {
    const firstUnrated = outfits.findIndex((o) => o.items.some((x) => x.item.paletteVerdict === null || x.item.paletteVerdict === undefined));
    const ratedAfter = outfits.slice(firstUnrated + 1).some((o) => o.items.every((x) => x.item.paletteVerdict === 'Perfect' || x.item.paletteVerdict === 'Strong'));
    if (ratedAfter) return false;
  }
  return true;
}

function unratedOutfitFixture() {
  return {
    items: [
      { itemId: 'u1', slot: 'base-top', item: item('u1', 'Unrated navy sweater', 'sweater', '#12284B', null, 90), warnings: [WARNING] },
      { itemId: 'o1', slot: 'outer-layer', item: item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93), warnings: [] },
      { itemId: 'b1', slot: 'bottom', item: item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95), warnings: [] },
      { itemId: 's1', slot: 'shoes', item: item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96), warnings: [] },
    ],
    explanation: [WARNING],
    cardWarnings: [WARNING],
    verified: false,
  };
}

test('interview unrated ISSUE-34: rated items are sorted first, unrated only as a fallback with a warning in card and explanation', () => {
  const rated = {
    items: [
      { itemId: 'w1', slot: 'base-top', item: item('w1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85), warnings: [] },
      { itemId: 'o1', slot: 'outer-layer', item: item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93), warnings: [] },
    ],
    explanation: ['Dark neutral bottom anchors this outfit.'],
    cardWarnings: [],
    verified: true,
  };
  assert.equal(interviewUnratedResultIsValid([rated, unratedOutfitFixture()]), true);
  assert.equal(interviewUnratedResultIsValid([unratedOutfitFixture(), rated]), false, 'an unrated outfit must not be sorted before a rated outfit');
  const unwarned = unratedOutfitFixture();
  unwarned.cardWarnings = [];
  assert.equal(interviewUnratedResultIsValid([unwarned]), false, 'a warning in the explanation alone is not enough, the card must warn too');
});

test('interview unrated ISSUE-34: an outfit made only of unrated items must not be presented as a verified interview outfit', () => {
  const allUnrated = {
    items: [
      { itemId: 'u1', slot: 'base-top', item: item('u1', 'Unrated navy sweater', 'sweater', '#12284B', null, 90), warnings: [WARNING] },
      { itemId: 'u2', slot: 'outer-layer', item: item('u2', 'Unrated charcoal cardigan', 'cardigan', '#36454F', null, 90), warnings: [WARNING] },
      { itemId: 'u3', slot: 'bottom', item: item('u3', 'Unrated charcoal trousers', 'trousers', '#36454F', null, 90), warnings: [WARNING] },
      { itemId: 'u4', slot: 'shoes', item: item('u4', 'Unrated black shoes', 'shoes', '#0A0E14', null, 90), warnings: [WARNING] },
    ],
    explanation: [WARNING],
    cardWarnings: [WARNING],
    verified: false,
  };
  assert.equal(interviewUnratedResultIsValid([allUnrated]), true);
  const claimedVerified = JSON.parse(JSON.stringify(allUnrated));
  claimedVerified.verified = true;
  assert.equal(interviewUnratedResultIsValid([claimedVerified]), false, 'an all-unrated outfit must not be marked verified');
});

test('interview unrated ISSUE-34: Avoid, Works, hoodies, and graphic tees are still rejected in interview builds', () => {
  const base = unratedOutfitFixture();
  for (const bad of [
    item('a1', 'Avoid orange sweater', 'sweater', '#E86A1F', 'Avoid', 99),
    item('wk1', 'Works sweater', 'sweater', '#5A6B7A', 'Works', 99),
    item('h1', 'Unrated hoodie', 'hoodie', '#36454F', null, 99),
    item('g1', 'Unrated graphic tee', 'graphic tee', '#FFFFFF', null, 99),
  ]) {
    const candidate = JSON.parse(JSON.stringify(base));
    candidate.items[0] = { itemId: bad.id, slot: 'base-top', item: bad, warnings: [WARNING] };
    assert.equal(interviewUnratedResultIsValid([candidate]), false, 'interview must reject: ' + bad.name);
  }
});

test('interview unrated ISSUE-34: a missing paletteVerdict is treated the same as a null paletteVerdict, never as Strong', () => {
  const missing = unratedOutfitFixture();
  delete missing.items[0].item.paletteVerdict;
  assert.equal(interviewUnratedResultIsValid([missing]), true, 'missing verdict must still carry the warning');
  assert.notEqual(missing.items[0].item.paletteVerdict, 'Strong', 'unrated must not be silently rewritten to Strong');
});

test('interview unrated ISSUE-34: unrated items are allowed, not excluded outright, when they are the fallback', () => {
  const outfit = unratedOutfitFixture();
  assert.ok(outfit.items.some((x) => x.itemId === 'u1'), 'fallback unrated item must be present in the outfit');
  assert.equal(interviewUnratedResultIsValid([outfit]), true);
});
