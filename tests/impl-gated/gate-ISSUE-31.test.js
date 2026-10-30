// Integration gate tests, refs ISSUE-31. Tightened gated tests with real
// wardrobes, real rating inputs, and real ingester page text, replacing
// the earlier interface skeletons for the cases covered here. These tests
// import production modules only; they do not change production code.
// No em dashes are used in this file.
// Limits, recorded honestly: the ingester input here is extracted page
// text, not a real PDF binary parsed by pdf.js in a browser, and swatch
// sampling from rendered pages is not exercised, because that part of
// spec 4.3 step 2 is not implemented (see tests/INTEGRATION-GATE.md).
// A real PDF binary end to end run remains unproven.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const engine = require('../../lib/outfit-engine/index.js');
const rating = require('../../lib/rating.js');
const ingester = require('../../lib/palette-ingester.js');

function item(id, name, category, hex, verdict, score, extra) {
  return Object.assign({
    id, name, category, primaryColorHex: hex, paletteVerdict: verdict,
    paletteScore: score, status: 'in rotation', season: 'all-season',
    fitTags: [], wearCount: 0,
  }, extra || {});
}

const dailyWardrobe = [
  item('w1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85),
  item('n1', 'Navy sweater', 'sweater', '#12284B', 'Perfect', 95),
  item('e1', 'Emerald knit', 'knit', '#046A38', 'Perfect', 95),
  item('c1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
  item('n2', 'Navy trousers', 'trousers', '#12284B', 'Perfect', 94),
  item('b1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
  item('c2', 'Charcoal cardigan', 'cardigan', '#36454F', 'Strong', 88),
  item('s1', 'Black leather shoes', 'shoes', '#0A0E14', 'Perfect', 96),
  item('s2', 'Dark shoes', 'shoes', '#1A1A1A', 'Strong', 85),
  item('x1', 'Archived emerald knit', 'knit', '#046A38', 'Perfect', 99, { status: 'archived' }),
  item('x2', 'Stored navy sweater', 'sweater', '#12284B', 'Perfect', 99, { status: 'stored' }),
];

test('gate ISSUE-31: daily build from a real wardrobe returns 3 outfits with distinct top and outer pairs', () => {
  const outfits = engine.buildOutfits({ items: dailyWardrobe, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [] });
  assert.equal(outfits.length, 3);
  const pairs = outfits.map((o) => {
    const top = (o.items.find((x) => x.slot === 'base-top') || {}).itemId || 'none';
    const outer = (o.items.find((x) => x.slot === 'outer-layer') || {}).itemId || 'none';
    return top + '|' + outer;
  });
  assert.equal(new Set(pairs).size, 3);
});

test('gate ISSUE-31: daily outfits obey hard rules, one slot each, at most one saturated accent, no archived or stored item', () => {
  const outfits = engine.buildOutfits({ items: dailyWardrobe, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [] });
  for (const outfit of outfits) {
    const slots = outfit.items.map((x) => x.slot);
    assert.equal(new Set(slots).size, slots.length, 'duplicate slot in outfit');
    const ids = outfit.items.map((x) => x.itemId);
    assert.ok(!ids.includes('x1'), 'archived item suggested');
    assert.ok(!ids.includes('x2'), 'stored item suggested');
    const mains = outfit.items.filter((x) => ['base-top', 'outer-layer', 'accessory'].includes(x.slot)).map((x) => x.item);
    assert.ok(mains.filter((it) => engine.isSaturatedAccent(it)).length <= 1, 'more than one saturated accent');
    assert.equal(typeof outfit.paletteScore, 'number');
    assert.equal(typeof outfit.fitScore, 'number');
    assert.equal(typeof outfit.contrastScore, 'number');
    assert.ok(Array.isArray(outfit.explanation) && outfit.explanation.length > 0, 'outfit has no explanation');
  }
});

test('gate ISSUE-31: interview build returns only Perfect and Strong, no hoodies or graphic tees, white collared shirt first', () => {
  const wardrobe = dailyWardrobe.concat([
    item('h1', 'Warm orange hoodie', 'hoodie', '#E86A1F', 'Perfect', 99),
    item('g1', 'Graphic tee', 'graphic tee', '#FFFFFF', 'Perfect', 99),
    item('wk1', 'Works as accent top', 'sweater', '#5A6B7A', 'Works', 65),
  ]);
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'interview', season: 'all-season', adviceRules: [], disliked: [] });
  assert.ok(outfits.length > 0, 'interview build returned nothing');
  for (const outfit of outfits) {
    for (const entry of outfit.items) {
      assert.ok(['Perfect', 'Strong'].includes(entry.item.paletteVerdict), 'interview outfit has a non Perfect or Strong item');
      assert.ok(!entry.itemId.includes('h1') && !entry.itemId.includes('g1'), 'interview outfit has a hoodie or graphic tee');
    }
  }
  const firstTop = (outfits[0].items.find((x) => x.slot === 'base-top') || {}).itemId;
  assert.equal(firstTop, 'w1', 'interview build does not prefer the white collared shirt first');
});

test('gate ISSUE-31: a fresh dislike blocks the exact combination, an aged dislike does not', () => {
  const single = [
    item('w1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85),
    item('b1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('c1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('s1', 'Black leather shoes', 'shoes', '#0A0E14', 'Perfect', 96),
  ];
  const built = engine.buildOutfits({ items: single, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [] });
  assert.equal(built.length, 1);
  const ids = built[0].items.map((x) => x.itemId);
  const fresh = engine.buildOutfits({ items: single, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [{ ids, dislikedAt: new Date().toISOString() }] });
  assert.equal(fresh.length, 0, 'freshly disliked combination was suggested again');
  const agedDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const aged = engine.buildOutfits({ items: single, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [{ ids, dislikedAt: agedDate }] });
  assert.equal(aged.length, 1, 'combination disliked more than 30 days ago is still blocked');
});

test('gate ISSUE-31: rating concrete cases, white Strong, navy Perfect or Strong, orange Avoid, pastel Avoid', () => {
  const white = rating.rateItem({ primaryHex: '#FFFFFF' }, null);
  assert.equal(white.verdict, 'Strong');
  const navy = rating.rateItem({ primaryHex: '#12284B' }, null);
  assert.ok(['Perfect', 'Strong'].includes(navy.verdict));
  const orange = rating.rateItem({ primaryHex: '#E86A1F' }, null);
  assert.equal(orange.verdict, 'Avoid');
  assert.match(orange.reason, /warm oranges/);
  assert.ok(orange.score <= 40);
  const pastel = rating.rateItem({ primaryHex: '#E8DDE6' }, null);
  assert.equal(pastel.verdict, 'Avoid');
  assert.match(pastel.reason, /light pastels/);
  const emerald = rating.rateItem({ primaryHex: '#046A38' }, null);
  assert.ok(['Perfect', 'Strong'].includes(emerald.verdict));
});

test('gate ISSUE-31: rating secondary clash, navy base with warm orange stripe over 25 percent is reduced and flagged', () => {
  const plain = rating.rateItem({ primaryHex: '#12284B' }, null);
  const clashed = rating.rateItem({
    primaryHex: '#12284B',
    secondary: [{ hex: '#E86A1F', percentage: 30 }],
  }, null);
  assert.equal(clashed.secondaryClash, true);
  assert.ok(clashed.score < plain.score, 'secondary clash did not reduce the score');
});

test('gate ISSUE-31: ingester extracts core, neutral, and avoid sections from page text with source pages', () => {
  const pages = [{ page: 1, text: 'Deep Winter\nCore colours\nRoyal Blue\nEmerald Green\nNeutrals\nNavy\nCharcoal Gray\nAvoid\nlight pastels, warm oranges, muted earthy hues' }];
  const extracted = ingester.extractFromPages(pages);
  const names = extracted.map((c) => c.name);
  assert.ok(names.includes('Royal Blue'));
  assert.ok(names.includes('Emerald Green'));
  assert.ok(names.includes('Navy'));
  assert.ok(names.includes('Charcoal Gray'));
  assert.ok(names.includes('light pastels'));
  assert.ok(names.includes('warm oranges'));
  assert.ok(names.includes('muted earthy hues'));
  assert.ok(extracted.every((c) => c.sourcePage === 1));
});

test('gate ISSUE-31: ingester never saves beauty page colours as clothing colours, and correction helpers work', () => {
  const pages = [
    { page: 1, text: 'Core colours\nRoyal Blue' },
    { page: 2, text: 'Makeup and blush\nLipstick shades for Deep Winter' },
  ];
  const extracted = ingester.extractFromPages(pages);
  assert.ok(extracted.every((c) => c.sourcePage !== 2), 'beauty page produced a clothing colour');
  const summary = ingester.summarizeColours(extracted);
  assert.ok(summary.warnings.length > 0, 'summary did not warn when neutrals or avoids are missing');
  const renamed = ingester.renameColour(extracted, 0, 'Royal Blue corrected');
  assert.equal(renamed[0].name, 'Royal Blue corrected');
  const roleChanged = ingester.changeRole(extracted, 0, 'neutral');
  assert.equal(roleChanged[0].role, 'neutral');
  const hexChanged = ingester.changeHex(extracted, 0, '#4169E1');
  assert.equal(hexChanged[0].hex, '#4169E1');
  const removed = ingester.removeBeautyColours([{ name: 'Blush pink', beauty: true }, { name: 'Navy', beauty: false }]);
  assert.equal(removed.kept.length, 1);
  assert.equal(removed.removedCount, 1);
});
