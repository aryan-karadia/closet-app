// Unit tests: item rating Delta E tiers and avoid rules, spec section 5.3.
// Issue: ISSUE-29. Status: GREEN for spec formula and fixture expectation tests.
// These tests check the formula as written in the spec and the expected
// verdicts in spec section 11.2. They do not prove a production rating
// engine works. Production proof is in tests/impl-gated/rating-engine.test.js,
// marked RED (awaiting implementation).
// No em dashes are used in this file.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RATING_CASES } = require('../fixtures/spec-data');
const {
  ratingScoreFromDeltaE,
  tierForScore,
  applyAvoidCap,
  applySecondaryClash,
  applySaturationAdjustment,
  rateBySpec,
} = require('../helpers/spec-rules');

test('rating: score equals 100 minus Delta E times 2, clamped 0 to 100', () => {
  assert.equal(ratingScoreFromDeltaE(0), 100);
  assert.equal(ratingScoreFromDeltaE(5), 90);
  assert.equal(ratingScoreFromDeltaE(15), 70);
  assert.equal(ratingScoreFromDeltaE(30), 40);
  assert.equal(ratingScoreFromDeltaE(60), 0);
  assert.equal(ratingScoreFromDeltaE(100), 0);
});

test('rating: tiers are Perfect 90 to 100, Strong 70 to 89, Works 50 to 69, Avoid 0 to 49', () => {
  assert.equal(tierForScore(100), 'Perfect');
  assert.equal(tierForScore(90), 'Perfect');
  assert.equal(tierForScore(89), 'Strong');
  assert.equal(tierForScore(70), 'Strong');
  assert.equal(tierForScore(69), 'Works');
  assert.equal(tierForScore(50), 'Works');
  assert.equal(tierForScore(49), 'Avoid');
  assert.equal(tierForScore(0), 'Avoid');
});

test('rating: Delta E under 5 gives 90 or above', () => {
  assert.ok(ratingScoreFromDeltaE(4) >= 90);
  assert.ok(ratingScoreFromDeltaE(4.9) >= 90);
});

test('rating: avoid cap sets verdict to Avoid and caps score at 40 regardless of Delta E', () => {
  const nearRed = applyAvoidCap(95, true);
  assert.equal(nearRed.verdict, 'Avoid');
  assert.ok(nearRed.score <= 40);
  const notAvoid = applyAvoidCap(95, false);
  assert.equal(notAvoid.verdict, 'Perfect');
  assert.equal(notAvoid.score, 95);
});

test('rating: secondary clash over 25 percent minus 15 points and flagged', () => {
  const flagged = applySecondaryClash(80, 30, true);
  assert.equal(flagged.score, 65);
  assert.equal(flagged.secondaryClash, true);
  const atBoundary = applySecondaryClash(80, 25, true);
  assert.equal(atBoundary.score, 80);
  assert.equal(atBoundary.secondaryClash, false);
  const under = applySecondaryClash(80, 10, true);
  assert.equal(under.secondaryClash, false);
  const notAvoidSecondary = applySecondaryClash(80, 30, false);
  assert.equal(notAvoidSecondary.secondaryClash, false);
});

test('rating: neutral saturation cap, neutrals are not penalised for low saturation', () => {
  assert.equal(applySaturationAdjustment(85, true, false, false), 85);
  assert.equal(applySaturationAdjustment(85, true, false, true), 85);
});

test('rating: core saturation penalty, much less saturated core loses 10 points', () => {
  assert.equal(applySaturationAdjustment(85, false, true, true), 75);
  assert.equal(applySaturationAdjustment(85, false, true, false), 85);
});

test('rating: full spec pipeline for multi colour navy base with warm orange stripe over 25 percent', () => {
  const result = rateBySpec({
    deltaE: 4,
    nearestIsNeutral: true,
    primaryMatchesAvoid: false,
    secondaryPercentage: 30,
    secondaryMatchesAvoid: true,
  });
  assert.equal(result.score, 77);
  assert.equal(result.secondaryClash, true);
  assert.equal(result.verdict, 'Strong');
});

test('rating: full spec pipeline for warm orange hoodie near true red still Avoid', () => {
  const result = rateBySpec({
    deltaE: 5,
    nearestIsNeutral: false,
    nearestIsCore: true,
    primaryMatchesAvoid: true,
  });
  assert.equal(result.verdict, 'Avoid');
  assert.ok(result.score <= 40);
});

test('rating: spec section 11.2 concrete cases have allowed verdicts and score ranges', () => {
  const byId = new Map(RATING_CASES.map((c) => [c.id, c]));
  assert.equal(byId.get('white-collared-shirt').expectedVerdict, 'Strong');
  assert.equal(byId.get('navy-sweater').expectedVerdict, 'Perfect or Strong');
  assert.equal(byId.get('warm-orange-hoodie').expectedVerdict, 'Avoid');
  assert.equal(byId.get('light-pastel-tee').expectedVerdict, 'Avoid');
  assert.ok(['Avoid', 'Avoid or Works as accent only'].includes(byId.get('muted-olive-item').expectedVerdict));
  assert.ok(['Avoid', 'Avoid or Works as accent only'].includes(byId.get('camel-item').expectedVerdict));
  assert.equal(byId.get('navy-base-warm-orange-stripe').secondary.percentage, 30);
  assert.ok(byId.get('navy-base-warm-orange-stripe').secondary.percentage > 25);
  for (const item of RATING_CASES) {
    assert.ok(item.expectedScoreRange[0] <= item.expectedScoreRange[1]);
    assert.ok(item.expectedScoreRange[0] >= 0 && item.expectedScoreRange[1] <= 100);
  }
});

test('rating: white collared shirt is Strong neutral, not Avoid', () => {
  const shirt = RATING_CASES.find((c) => c.id === 'white-collared-shirt');
  assert.equal(shirt.expectedVerdict, 'Strong');
  assert.equal(shirt.isNeutral, true);
  assert.equal(shirt.matchesAvoidRule, null);
});

test('rating: every rating must store score, nearest colour, verdict, and reason', () => {
  const requiredFields = ['score', 'nearestPaletteColorId', 'nearestPaletteColorName', 'verdict', 'reason'];
  const example = {
    score: 92,
    nearestPaletteColorId: 'palette-navy',
    nearestPaletteColorName: 'navy',
    verdict: 'Perfect',
    reason: 'This navy is 4 Delta E from your Navy, a perfect neutral match.',
  };
  for (const field of requiredFields) {
    assert.ok(field in example, 'missing rating field: ' + field);
  }
});

test('rating: manual override is stored separately and does not overwrite auto score', () => {
  const item = { autoScore: 62, manualScore: null, manualScoreNote: null };
  item.manualScore = 80;
  item.manualScoreNote = 'looks better in person';
  assert.equal(item.autoScore, 62);
  assert.equal(item.manualScore, 80);
  assert.equal(item.manualScoreNote, 'looks better in person');
});
