// Spec oracle helpers for the test suite only.
// These functions restate the formulas in the build spec so tests can check
// spec boundaries without production code. They are NOT production code.
// Production code must live in lib/ (or the app source) and must pass the
// implementation-gated tests in tests/impl-gated/ independently. Do not
// import this file from production code.
// Spec references are in comments. No em dashes are used in this file.

'use strict';

function clampScore(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

// Spec section 5.3: score equals 100 minus (Delta E times 2), clamped 0 to 100.
// Delta E under 5 gives 90 or above. Delta E 15 gives 70. Delta E 30 gives 40.
function ratingScoreFromDeltaE(deltaE) {
  return clampScore(100 - deltaE * 2);
}

// Spec section 5.3 final verdict tiers.
function tierForScore(score) {
  if (score >= 90) return 'Perfect';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Works';
  return 'Avoid';
}

// Spec section 5.3 avoid check: primary avoid match caps score at 40 and
// sets verdict to Avoid, regardless of Delta E.
function applyAvoidCap(baseScore, primaryMatchesAvoid) {
  if (!primaryMatchesAvoid) return { score: baseScore, verdict: tierForScore(baseScore) };
  return { score: Math.min(baseScore, 40), verdict: 'Avoid' };
}

// Spec section 5.3: secondary over 25 percent, minus 15 points, flagged.
function applySecondaryClash(score, secondaryPercentage, secondaryMatchesAvoid) {
  const flagged = secondaryMatchesAvoid && secondaryPercentage > 25;
  if (!flagged) return { score, secondaryClash: false };
  return { score: clampScore(score - 15), secondaryClash: true };
}

// Spec section 5.3: neutral saturation cap and core saturation penalty.
// Neutral: no saturation penalty. Core much less saturated than the swatch: minus 10.
function applySaturationAdjustment(score, nearestIsNeutral, nearestIsCore, coreMuchLessSaturated) {
  if (nearestIsNeutral) return score;
  if (nearestIsCore && coreMuchLessSaturated) return clampScore(score - 10);
  return score;
}

// Full spec rating pipeline in spec order: base, saturation, avoid cap, secondary.
function rateBySpec(input) {
  let score = ratingScoreFromDeltaE(input.deltaE);
  score = applySaturationAdjustment(
    score,
    input.nearestIsNeutral === true,
    input.nearestIsCore === true,
    input.coreMuchLessSaturated === true,
  );
  const avoided = applyAvoidCap(score, input.primaryMatchesAvoid === true);
  score = avoided.score;
  const secondary = applySecondaryClash(score, input.secondaryPercentage || 0, input.secondaryMatchesAvoid === true);
  score = secondary.score;
  const verdict = avoided.verdict === 'Avoid' ? 'Avoid' : tierForScore(score);
  return { score, verdict, secondaryClash: secondary.secondaryClash };
}

// Outfit slot counting, used only to classify fixtures against hard rules.
// Counting slots is not the outfit engine. The engine is tested in impl-gated tests.
function countBySlot(items) {
  const counts = {};
  for (const item of items) {
    counts[item.slot] = (counts[item.slot] || 0) + 1;
  }
  return counts;
}

function countSaturatedAccentsAsMain(items) {
  return items.filter((item) => item.isSaturatedAccentAsMain === true).length;
}

// Spec sections 6.2 and 6.3 hard rules, as a fixture classifier.
function hardRuleViolations(outfit) {
  const violations = [];
  const counts = countBySlot(outfit.items);
  if ((counts['outer layer'] || 0) > 1) violations.push('two outer layers');
  if ((counts.bottom || 0) > 1) violations.push('two bottoms');
  if ((counts.shoes || 0) > 1) violations.push('two pairs of shoes');
  if (countSaturatedAccentsAsMain(outfit.items) > 1) violations.push('more than one saturated accent as main colour');
  if (outfit.items.some((item) => item.status !== 'in rotation')) {
    violations.push('archived or stored item included');
  }
  return violations;
}

// Spec section 6.4 interview rules, as a fixture classifier.
function interviewViolations(outfit) {
  const violations = [];
  for (const item of outfit.items) {
    if (item.paletteVerdict !== 'Perfect' && item.paletteVerdict !== 'Strong') {
      violations.push('interview item is not Perfect or Strong: ' + item.name);
    }
    if (item.category === 'hoodie' || item.category === 'graphic tee') {
      violations.push('interview outfit contains a hoodie or graphic tee: ' + item.name);
    }
  }
  return violations;
}

// Spec section 6.7: dislike blocks the exact same combination for 30 days.
function isDislikedCombinationBlocked(dislikedAt, suggestedAt, sameCombination) {
  if (!sameCombination) return false;
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = (suggestedAt.getTime() - dislikedAt.getTime()) / msPerDay;
  return days >= 0 && days < 30;
}

// Spec section 6.5: a disabled rule must never affect scoring. This helper
// sums only enabled rule weights, which is the spec behaviour the production
// engine must reproduce.
function scoreFromEnabledRulesOnly(rules) {
  let total = 0;
  for (const rule of rules) {
    if (rule.enabled === true) total += rule.weight || 0;
  }
  return total;
}

// Spec section 4.3 step 4: palette summary and warnings.
function paletteSummary(colours) {
  const core = colours.filter((c) => c.role === 'core').length;
  const neutral = colours.filter((c) => c.role === 'neutral').length;
  const avoid = colours.filter((c) => c.role === 'avoid').length;
  const warnings = [];
  if (neutral === 0) warnings.push('warning: zero neutrals');
  if (avoid === 0) warnings.push('warning: zero avoids');
  return { core, neutral, avoid, warnings };
}

module.exports = {
  clampScore,
  ratingScoreFromDeltaE,
  tierForScore,
  applyAvoidCap,
  applySecondaryClash,
  applySaturationAdjustment,
  rateBySpec,
  countBySlot,
  countSaturatedAccentsAsMain,
  hardRuleViolations,
  interviewViolations,
  isDislikedCombinationBlocked,
  scoreFromEnabledRulesOnly,
  paletteSummary,
};
