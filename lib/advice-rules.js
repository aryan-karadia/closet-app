// Advice rules library (refs ISSUE-15, spec section 6.5).
// The 10 starting rules are editable records, not code constants, in the
// API. This library holds the starting set in full fidelity, including the
// avoid tag where a rule has both a prefer tag and an avoid tag, and the
// helper that a disabled rule must never affect scoring.
// This file is plain JavaScript so it is importable from Node require
// (tests/impl-gated/advice-rules.test.js requires this exact path,
// lib/advice-rules.js) and from TypeScript via lib/advice-rules.d.ts.
// No em dashes are used in this file.
'use strict';

const STARTING_ADVICE_RULES = [
  {
    name: 'Shoulders first',
    conditionCategory: 'top or outer',
    conditionFitTag: 'structured shoulder or fits shoulders',
    avoidTag: 'dropped shoulder or too tight in shoulders',
    action: 'prefer',
    weight: 80,
    reason: 'Size for wide shoulders and large traps first.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Base layer arms',
    conditionCategory: 'base top',
    conditionFitTag: 'fitted sleeve or fitted arms',
    action: 'prefer',
    weight: 70,
    reason: 'Tighter fit on arms to show muscles, without sizing down the outer layer.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Outer body',
    conditionCategory: 'outer layer',
    conditionFitTag: 'relaxed body or loose chest and stomach',
    avoidTag: 'tight chest or boxy all over',
    action: 'prefer',
    weight: 70,
    reason: 'Loose in chest and stomach, but structured at the shoulder, not boxy everywhere.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Trouser cut',
    conditionCategory: 'trousers or jeans',
    conditionFitTag: 'straight or tapered',
    avoidTag: 'very slim or skinny',
    action: 'prefer',
    weight: 60,
    reason: 'Very slim bottoms make a broad upper body look top heavy, and need room for wide feet and shoes.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Sleeve fit',
    conditionCategory: 'base top',
    conditionFitTag: 'billowy sleeve or very loose sleeve',
    action: 'avoid',
    weight: 60,
    reason: 'Loose sleeves hide the arm fit the user prefers.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Contrast',
    conditionCategory: 'outfit',
    conditionFitTag: null,
    avoidTag: 'low contrast pastel on pastel',
    action: 'prefer',
    weight: 80,
    reason: 'Deep Winter needs high contrast, and low contrast washes out the palette.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'Colour temperature',
    conditionCategory: 'outfit',
    conditionFitTag: null,
    avoidTag: 'warm oranges and warm browns as main colours',
    action: 'prefer',
    weight: 70,
    reason: 'Deep Winter is a cool palette.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'One detail',
    conditionCategory: 'outfit',
    conditionFitTag: null,
    action: 'prefer',
    weight: 50,
    reason: 'Structured softboy style, one romantic detail per outfit.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'Jewelry and watch',
    conditionCategory: 'accessory',
    conditionFitTag: null,
    action: 'prefer',
    weight: 40,
    reason: 'Silver fits the cool undertone, and a leather band watch is a priority accessory.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'Neckline',
    conditionCategory: 'base top',
    conditionFitTag: null,
    action: 'prefer',
    weight: 30,
    reason: 'A high closed crew neck under a closed outer can make large traps and a broad neck look more crowded. This rule is a preference, not a hard filter.',
    source: 'User stated fit preference',
    enabled: true,
  },
];

function getStartingRules() {
  return STARTING_ADVICE_RULES.map((rule) => ({ ...rule }));
}

function enabledRules(rules) {
  return (rules || []).filter((rule) => rule.enabled === true);
}

// A disabled rule must never affect scoring (spec 6.5). Only enabled
// rules contribute their weight.
function scoreFromEnabledRulesOnly(rules) {
  let total = 0;
  for (const rule of enabledRules(rules)) {
    total += rule.weight || 0;
  }
  return total;
}

module.exports = {
  STARTING_ADVICE_RULES,
  getStartingRules,
  enabledRules,
  scoreFromEnabledRulesOnly,
};
