// Implementation-gated fix tests, refs ISSUE-32, ISSUE-33, ISSUE-34.
// Written from the spec and the ISSUE-34 decision, not from any Agent A
// fix code. These tests import the production engine at
// lib/outfit-engine/index.js, which is the existing public interface
// (buildOutfits). They do not import any new Agent A helper, because no
// new helper name is specified by the issues.
// Status on main at cfb03d8 (before the Agent A fix): the diversity
// and unrated tests below FAIL, which is the pre-fix reproduction of
// ISSUE-31 gate bugs 1 to 3 as routed in ISSUE-32, ISSUE-33, and
// ISSUE-34. They must PASS after the Agent A fix. Do not edit these
// tests to hide a failure; fix the engine or the UI instead.
// Shuffle: shuffleSlot lives in app/page.tsx (React and JSX) and cannot
// be executed by node:test, so the shuffle cases here are SKIPPED with
// that reason. The same shuffle cases are executed at spec level in
// tests/unit/shuffle-diversity-interview-fix.test.js, and the React
// button itself still needs a browser or manual check, flagged in the
// PR file. A skipped shuffle test is not a shuffle pass.
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../lib/outfit-engine/index.js');

const WARNING_EXAMPLE = 'Unrated item included, palette fit not verified';

function item(id, name, category, hex, verdict, score, extra) {
  return Object.assign({
    id, name, category, primaryColorHex: hex, paletteVerdict: verdict,
    paletteScore: score, status: 'in rotation', season: 'all-season',
    fitTags: [], wearCount: 0,
  }, extra || {});
}

function pairOf(outfit) {
  const top = (outfit.items.find((x) => x.slot === 'base-top') || {}).itemId || 'none';
  const outer = (outfit.items.find((x) => x.slot === 'outer-layer') || {}).itemId || 'none';
  return top + '|' + outer;
}

function hasUnratedWarning(outfit) {
  const text = JSON.stringify(outfit).toLowerCase();
  return text.includes('unrated') && (text.includes('not verified') || text.includes('palette fit'));
}

function resultMessage(outfitOrResult) {
  const candidates = [];
  if (outfitOrResult && typeof outfitOrResult.message === 'string') candidates.push(outfitOrResult.message);
  if (outfitOrResult && typeof outfitOrResult.diversityMessage === 'string') candidates.push(outfitOrResult.diversityMessage);
  if (outfitOrResult && typeof outfitOrResult.warning === 'string') candidates.push(outfitOrResult.warning);
  if (Array.isArray(outfitOrResult)) {
    if (typeof outfitOrResult.message === 'string') candidates.push(outfitOrResult.message);
    if (typeof outfitOrResult.diversityMessage === 'string') candidates.push(outfitOrResult.diversityMessage);
    for (const outfit of outfitOrResult) {
      if (typeof outfit.message === 'string') candidates.push(outfit.message);
      if (typeof outfit.diversityMessage === 'string') candidates.push(outfit.diversityMessage);
      if (Array.isArray(outfit.explanation)) candidates.push(...outfit.explanation);
    }
  } else if (outfitOrResult && Array.isArray(outfitOrResult.explanation)) {
    candidates.push(...outfitOrResult.explanation);
  }
  return candidates.find((value) => /distinct|diversity|fewer|only .* pair|not enough|small wardrobe/i.test(value)) || '';
}

// Shuffle, ISSUE-32. Skipped in node:test for the reason above. Each
// skipped case names the exact would-be violating alternative that a
// correct shuffle must reject or replace. See the spec level versions
// of these cases in tests/unit/shuffle-diversity-interview-fix.test.js.
const shuffleSkip = { skip: 'ShuffleSlot lives in app/page.tsx (React and JSX) and cannot be executed by node:test. Spec level shuffle cases pass in tests/unit/shuffle-diversity-interview-fix.test.js. The React button still needs a browser or manual check (refs ISSUE-32).' };

test('fix ISSUE-32 shuffle: extra saturated accent alternative is rejected or replaced', shuffleSkip, () => {
  assert.ok(false, 'skipped shuffle case, see skip reason');
});

test('fix ISSUE-32 shuffle: interview excluded category alternative is rejected or replaced', shuffleSkip, () => {
  assert.ok(false, 'skipped shuffle case, see skip reason');
});

test('fix ISSUE-32 shuffle: Avoid verdict alternative is rejected or replaced', shuffleSkip, () => {
  assert.ok(false, 'skipped shuffle case, see skip reason');
});

test('fix ISSUE-32 shuffle: disliked combination alternative is rejected or replaced', shuffleSkip, () => {
  assert.ok(false, 'skipped shuffle case, see skip reason');
});

test('fix ISSUE-32 shuffle: shuffle replaces only that slot, and keeps the original when no valid alternative exists', shuffleSkip, () => {
  assert.ok(false, 'skipped shuffle case, see skip reason');
});

// Diversity, ISSUE-33. Spec 6.3 step 4 variety: the final outfits must
// not share the same base top and outer combination.
test('fix ISSUE-33 diversity: a small wardrobe with one top and outer pair never returns silent repeats', () => {
  const wardrobe = [
    item('t1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85),
    item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('b2', 'Navy trousers', 'trousers', '#12284B', 'Perfect', 94),
    item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
    item('s2', 'Dark shoes', 'shoes', '#1A1A1A', 'Strong', 85),
  ];
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [] });
  const pairs = outfits.map(pairOf);
  assert.equal(new Set(pairs).size, pairs.length, 'diversity fill repeated a top and outer pair: ' + pairs.join(', '));
  assert.ok(outfits.length <= 1, 'one distinct pair can supply at most one distinct outfit, got ' + outfits.length);
});

test('fix ISSUE-33 diversity: a small wardrobe with two distinct pairs returns at most two outfits, never a repeat', () => {
  const wardrobe = [
    item('t1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85),
    item('t2', 'Navy sweater', 'sweater', '#12284B', 'Perfect', 95),
    item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
    item('s2', 'Dark shoes', 'shoes', '#1A1A1A', 'Strong', 85),
  ];
  // Only t1|o1 and t2|o1 are distinct pairs here, so at most 2 outfits
  // can be returned without a repeat.
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [] });
  const pairs = outfits.map(pairOf);
  assert.equal(new Set(pairs).size, pairs.length, 'diversity fill repeated a top and outer pair: ' + pairs.join(', '));
  assert.ok(outfits.length <= 2, 'two distinct pairs can supply at most two distinct outfits, got ' + outfits.length);
});

test('fix ISSUE-33 diversity: fewer than 3 outfits must carry a message about the shortfall', () => {
  const wardrobe = [
    item('t1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85),
    item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('b2', 'Navy trousers', 'trousers', '#12284B', 'Perfect', 94),
    item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
    item('s2', 'Dark shoes', 'shoes', '#1A1A1A', 'Strong', 85),
  ];
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'daily', season: 'all-season', adviceRules: [], disliked: [] });
  if (outfits.length >= 3) {
    const pairs = outfits.map(pairOf);
    assert.equal(new Set(pairs).size, 3, 'three outfits must have three distinct pairs');
    return;
  }
  const message = resultMessage(outfits);
  assert.ok(message.length > 0, 'fewer than 3 outfits were returned with no message about the distinct pair shortfall. The fix must surface a message in the build result, an outfit message, or an explanation line. See ISSUE-33.');
});

// Interview unrated, ISSUE-34 decision recorded 2026-10-30. Perfect and
// Strong preferred and sorted first, null or missing paletteVerdict
// allowed only as a fallback with a warning, Avoid and excluded
// categories still rejected, and unrated never silently treated as
// Strong. The warning wording below is the decision example, so the
// tests accept any warning that names unrated items and says palette
// fit is not verified, in the outfit explanation, which is the engine
// part of the card and explanation requirement. The outfit card itself
// is UI and is covered by the skipped card test below.
test('fix ISSUE-34 interview unrated: a score 99 unrated top must not be sorted before a rated top', () => {
  const wardrobe = [
    item('r1', 'Charcoal sweater', 'sweater', '#36454F', 'Strong', 85),
    item('u1', 'Unrated navy sweater', 'sweater', '#12284B', null, 99),
    item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
  ];
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'interview', season: 'all-season', adviceRules: [], disliked: [] });
  assert.ok(outfits.length > 0, 'interview build returned nothing');
  const firstTop = (outfits[0].items.find((x) => x.slot === 'base-top') || {}).itemId;
  assert.equal(firstTop, 'r1', 'unrated item with score 99 was sorted before a rated item, treating unrated as Strong');
});

test('fix ISSUE-34 interview unrated: a missing paletteVerdict is treated the same as null, never as Strong', () => {
  const wardrobe = [
    item('r1', 'Charcoal sweater', 'sweater', '#36454F', 'Strong', 85),
    item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
  ];
  const missing = { id: 'u2', name: 'Unrated missing verdict sweater', category: 'sweater', primaryColorHex: '#12284B', paletteScore: 99, status: 'in rotation', season: 'all-season', fitTags: [], wearCount: 0 };
  wardrobe.push(missing);
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'interview', season: 'all-season', adviceRules: [], disliked: [] });
  assert.ok(outfits.length > 0, 'interview build returned nothing');
  const firstTop = (outfits[0].items.find((x) => x.slot === 'base-top') || {}).itemId;
  assert.equal(firstTop, 'r1', 'missing verdict item with score 99 was sorted before a rated item');
  for (const outfit of outfits) {
    for (const entry of outfit.items) {
      if (entry.itemId === 'u2') assert.ok(entry.item.paletteVerdict === null || entry.item.paletteVerdict === undefined, 'missing verdict was rewritten, it must stay missing, not Strong');
    }
  }
});

test('fix ISSUE-34 interview unrated: an unrated top is allowed only as a fallback, with a warning in the explanation', () => {
  const wardrobe = [
    item('u1', 'Unrated navy sweater', 'sweater', '#12284B', null, 90),
    item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
  ];
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'interview', season: 'all-season', adviceRules: [], disliked: [] });
  assert.ok(outfits.length > 0, 'unrated fallback top must be allowed when no rated top exists');
  const withUnrated = outfits.filter((o) => o.items.some((x) => x.itemId === 'u1'));
  assert.ok(withUnrated.length > 0, 'unrated fallback top was not used');
  for (const outfit of withUnrated) {
    assert.ok(hasUnratedWarning(outfit), 'outfit containing an unrated item has no unrated warning in its explanation. Expected a warning like: ' + WARNING_EXAMPLE);
    assert.ok(Array.isArray(outfit.explanation) && outfit.explanation.length > 0, 'outfit explanation is missing');
  }
});

test('fix ISSUE-34 interview unrated: an all-unrated outfit is allowed only with a warning, and is never presented as verified', () => {
  const wardrobe = [
    item('u1', 'Unrated navy sweater', 'sweater', '#12284B', null, 90),
    item('u2', 'Unrated charcoal cardigan', 'cardigan', '#36454F', null, 90),
    item('u3', 'Unrated charcoal trousers', 'trousers', '#36454F', null, 90),
    item('u4', 'Unrated black shoes', 'shoes', '#0A0E14', null, 90),
  ];
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'interview', season: 'all-season', adviceRules: [], disliked: [] });
  for (const outfit of outfits) {
    assert.ok(hasUnratedWarning(outfit), 'all-unrated outfit has no unrated warning in its explanation. Expected a warning like: ' + WARNING_EXAMPLE);
    assert.notEqual(outfit.verified, true, 'all-unrated outfit must not be marked verified');
    for (const entry of outfit.items) {
      assert.ok(entry.item.paletteVerdict === null || entry.item.paletteVerdict === undefined, 'unrated item was rewritten to a rated verdict');
    }
  }
});

test('fix ISSUE-34 interview unrated: Avoid, Works, unrated hoodies, and unrated graphic tees are still rejected', () => {
  const wardrobe = [
    item('w1', 'White collared shirt', 'shirt', '#FFFFFF', 'Strong', 85),
    item('a1', 'Avoid orange sweater', 'sweater', '#E86A1F', 'Avoid', 99),
    item('h1', 'Unrated hoodie', 'hoodie', '#36454F', null, 99),
    item('g1', 'Unrated graphic tee', 'graphic tee', '#FFFFFF', null, 99),
    item('wk1', 'Works sweater', 'sweater', '#5A6B7A', 'Works', 99),
    item('o1', 'Navy blazer', 'blazer', '#12284B', 'Perfect', 93),
    item('b1', 'Charcoal trousers', 'trousers', '#36454F', 'Perfect', 95),
    item('s1', 'Black shoes', 'shoes', '#0A0E14', 'Perfect', 96),
  ];
  const outfits = engine.buildOutfits({ items: wardrobe, occasion: 'interview', season: 'all-season', adviceRules: [], disliked: [] });
  assert.ok(outfits.length > 0, 'interview build returned nothing');
  const ids = outfits.flatMap((o) => o.items.map((x) => x.itemId));
  for (const bad of ['a1', 'h1', 'g1', 'wk1']) {
    assert.ok(!ids.includes(bad), 'interview outfit contains rejected item ' + bad);
  }
});

test('fix ISSUE-34 interview unrated: warning appears in the outfit card as well as the explanation', { skip: 'Outfit card rendering lives in app/page.tsx (React) and cannot be executed by node:test. Engine explanation warning is tested above. Card warning still needs a browser or manual check (refs ISSUE-34).' }, () => {
  assert.ok(false, 'skipped card case, see skip reason');
});
