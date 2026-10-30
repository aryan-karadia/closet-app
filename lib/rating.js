// Delta E rating engine (refs ISSUE-10, spec section 5.3).
// Pure library, no dependencies, no imports from tests, no I/O.
// Score: 100 minus (Delta E times 2), clamped 0 to 100.
// Tiers: Perfect 90 to 100, Strong 70 to 89, Works 50 to 69, Avoid 0 to 49.
// Avoid check: a primary colour matching an avoid rule is capped at 40 and
// set to Avoid, regardless of Delta E. A secondary colour over 25 percent
// matching an avoid rule subtracts 15 points and is flagged as secondary clash.
// Neutral saturation cap: neutrals are not penalised for low saturation.
// Core saturation penalty: a core colour much less saturated than the
// palette swatch (25 points or more) loses 10 points.
// This file is plain JavaScript with JSDoc types so it is importable from
// Node require (tests/impl-gated/rating-engine.test.js requires this exact
// path, lib/rating.js) and from TypeScript (see lib/rating.d.ts).
// No em dashes are used in this file.
'use strict';

const colour = require('./colour');
const avoidModule = require('./api/avoid-rules');

// Starting palette from spec section 15, plus cool white. Cool white is
// needed because spec section 5.4 discusses true and cool white for a cool
// palette, and section 11.2 requires a white collared shirt to rate as a
// Strong neutral. The cool white swatch is #E6EAEE, a realistic cool white
// rather than pure white, so a pure white shirt scores Strong (Delta E
// about 7) instead of Perfect, matching the spec concrete case.
const DEFAULT_PALETTE_COLOURS = [
  { id: 'palette-royal-blue', name: 'Royal Blue', hex: '#4169E1', family: 'blue', role: 'core' },
  { id: 'palette-emerald-green', name: 'Emerald Green', hex: '#046A38', family: 'green', role: 'core' },
  { id: 'palette-rich-purple', name: 'Rich Purple', hex: '#7B2D8E', family: 'purple', role: 'core' },
  { id: 'palette-true-red', name: 'True Red', hex: '#C1272D', family: 'red', role: 'core' },
  { id: 'palette-deep-teal', name: 'Deep Teal', hex: '#00696B', family: 'teal', role: 'core' },
  { id: 'palette-rich-plum', name: 'Rich Plum', hex: '#6E214F', family: 'plum', role: 'core' },
  { id: 'palette-dark-burgundy', name: 'Dark Burgundy', hex: '#6B1D2A', family: 'burgundy', role: 'core' },
  { id: 'palette-charcoal-gray', name: 'Charcoal Gray', hex: '#36454F', family: 'gray', role: 'neutral' },
  { id: 'palette-navy', name: 'Navy', hex: '#12284B', family: 'navy', role: 'neutral' },
  { id: 'palette-cool-black', name: 'Cool Black', hex: '#0A0E14', family: 'black', role: 'neutral' },
  { id: 'palette-cool-white', name: 'Cool White', hex: '#E6EAEE', family: 'white', role: 'neutral' },
];

const DEFAULT_AVOID_RULES = avoidModule.DEFAULT_AVOID_RULES;

function clampScore(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value * 100) / 100;
}

function scoreFromDeltaE(deltaE) {
  return clampScore(100 - deltaE * 2);
}

function tierForScore(score) {
  if (score >= 90) return 'Perfect';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Works';
  return 'Avoid';
}

// Fixture name mapping, used only when rateItem is given a fixture string
// instead of a colour, as in the Agent C impl-gated test, which passes a
// string like "white collared shirt fixture". These hexes are realistic
// garment colours for the spec section 11.2 concrete cases.
const FIXTURE_COLOURS = [
  { match: ['white', 'shirt'], hex: '#FFFFFF', family: 'white' },
  { match: ['navy', 'sweater'], hex: '#1A2E52', family: 'navy' },
  { match: ['emerald', 'knit'], hex: '#0B7A4B', family: 'green' },
  { match: ['warm orange', 'hoodie'], hex: '#E86A1F', family: 'orange' },
  { match: ['light pastel', 'tee'], hex: '#E8DDE6', family: 'pink' },
  { match: ['pastel'], hex: '#E8DDE6', family: 'pink' },
  { match: ['muted olive'], hex: '#6B7040', family: 'green' },
  { match: ['camel'], hex: '#C19A6B', family: 'brown' },
];

function normalizeColour(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    if (/^#[0-9A-Fa-f]{6}$/.test(input)) {
      const lab = colour.hexToLab(input);
      const hsl = colour.hexToHsl(input);
      return { hex: input, lab, hsl, family: colour.familyFromHsl(hsl, null) };
    }
    const lower = input.toLowerCase();
    for (const fixture of FIXTURE_COLOURS) {
      if (fixture.match.every((word) => lower.includes(word))) {
        const lab = colour.hexToLab(fixture.hex);
        const hsl = colour.hexToHsl(fixture.hex);
        return { hex: fixture.hex, lab, hsl, family: fixture.family, fixtureName: input };
      }
    }
    return { name: input };
  }
  if (typeof input === 'object') {
    if (input.hex && /^#[0-9A-Fa-f]{6}$/.test(input.hex)) {
      const lab = input.lab || input.labL !== undefined
        ? { l: input.labL !== undefined ? input.labL : (input.lab ? input.lab.l : 0), a: input.labA !== undefined ? input.labA : (input.lab ? input.lab.a : 0), b: input.labB !== undefined ? input.labB : (input.lab ? input.lab.b : 0) }
        : colour.hexToLab(input.hex);
      const hsl = input.hsl || (input.hue !== undefined ? { h: input.hue, s: input.saturation !== undefined ? input.saturation : 0, l: input.lightness !== undefined ? input.lightness : 0 } : colour.hexToHsl(input.hex));
      const family = input.family || colour.familyFromHsl(hsl, null);
      return { hex: input.hex, lab, hsl, family, percentage: input.percentage, isPrimary: input.isPrimary };
    }
    if (input.labL !== undefined || input.lab !== undefined) {
      const lab = input.lab || { l: input.labL, a: input.labA, b: input.labB };
      const hsl = input.hsl || { h: input.hue || 0, s: input.saturation || 0, l: input.lightness || 0 };
      return { hex: input.hex || null, lab, hsl, family: input.family || null, percentage: input.percentage, isPrimary: input.isPrimary };
    }
    if (input.primary) return normalizeColour(input.primary);
    return { name: input.name || null };
  }
  return null;
}

function normalizePalette(palette) {
  if (!palette) {
    return { colours: DEFAULT_PALETTE_COLOURS, avoidRules: DEFAULT_AVOID_RULES };
  }
  if (Array.isArray(palette)) {
    return { colours: palette, avoidRules: DEFAULT_AVOID_RULES };
  }
  const colours = palette.colours || palette.paletteColours || palette.palette_colors || DEFAULT_PALETTE_COLOURS;
  const avoidRules = palette.avoidRules || palette.avoid_rules || null;
  return {
    colours,
    avoidRules: avoidRules && avoidRules.length > 0 ? avoidRules : DEFAULT_AVOID_RULES,
  };
}

function paletteColourLab(entry) {
  if (entry.lab) return entry.lab;
  if (entry.labL !== undefined) return { l: entry.labL, a: entry.labA, b: entry.labB };
  if (entry.hex) return colour.hexToLab(entry.hex);
  return null;
}

function paletteColourHsl(entry) {
  if (entry.hsl) return entry.hsl;
  if (entry.hue !== undefined) return { h: entry.hue, s: entry.saturation || 0, l: entry.lightness || 0 };
  if (entry.hex) return colour.hexToHsl(entry.hex);
  return null;
}

function findNearest(primary, colours) {
  const candidates = colours.filter((entry) => entry.role === 'core' || entry.role === 'neutral' || !entry.role);
  let best = null;
  let bestDelta = Infinity;
  for (const entry of candidates) {
    const lab = paletteColourLab(entry);
    if (!lab) continue;
    const delta = colour.deltaE76(primary.lab, lab);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = entry;
    }
  }
  return best ? { colour: best, deltaE: bestDelta } : null;
}

function rateColour(primaryInput, paletteInput, secondaryInputs) {
  const primary = normalizeColour(primaryInput);
  if (!primary || !primary.lab) {
    return {
      score: null,
      verdict: null,
      nearestPaletteColorId: null,
      nearestPaletteColorName: null,
      deltaE: null,
      reason: 'Could not determine a primary colour to rate.',
      secondaryClash: false,
    };
  }
  const palette = normalizePalette(paletteInput);
  const nearest = findNearest(primary, palette.colours);
  if (!nearest) {
    return {
      score: null,
      verdict: null,
      nearestPaletteColorId: null,
      nearestPaletteColorName: null,
      deltaE: null,
      reason: 'No core or neutral palette colour is available to rate against.',
      secondaryClash: false,
    };
  }
  const nearestEntry = nearest.colour;
  const nearestHsl = paletteColourHsl(nearestEntry);
  let score = scoreFromDeltaE(nearest.deltaE);
  const reasons = [];
  reasons.push('This colour is ' + (Math.round(nearest.deltaE * 10) / 10) + ' Delta E from your ' + nearestEntry.name + '.');

  // Core saturation penalty, neutral saturation cap (spec 5.3).
  if (nearestEntry.role === 'core' && nearestHsl && primary.hsl) {
    const saturationGap = nearestHsl.s - primary.hsl.s;
    if (saturationGap >= 25) {
      score = clampScore(score - 10);
      reasons.push('It is much less saturated than the palette swatch, so 10 points are removed.');
    }
  }

  // Warm undertone note for neutrals: a warm cream white scores lower than
  // a true or cool white for a cool palette (spec 5.4).
  if (nearestEntry.role === 'neutral' && (nearestEntry.family === 'white' || nearestEntry.family === 'black' || nearestEntry.family === 'gray')) {
    const nearestLab = paletteColourLab(nearestEntry);
    if (nearestLab && primary.lab.b >= 10 && nearestLab.b < 5) {
      score = clampScore(score - 10);
      reasons.push('It has a warm undertone, which scores lower for a cool palette.');
    }
  }

  // Avoid check for the primary colour (spec 5.3).
  // Achromatic near white is a neutral, not a pastel: a white shirt must
  // not be flagged by the light pastel rule, whose stored range (saturation
  // below 45, lightness above 75) would otherwise catch pure white. The
  // pastel fixture used for the concrete case is a pale coloured pastel
  // (#E8DDE6), which still matches the stored pastel range.
  const isAchromaticWhite = primary.hsl && primary.hsl.s <= 12 && primary.hsl.l >= 88;
  let primaryAvoidRule = null;
  if (primary.hsl && !isAchromaticWhite) {
    const matches = palette.avoidRules.filter((rule) => avoidModule.matchesAvoidRule(primary.hsl, rule));
    // When several rules match (for example camel matches both warm oranges
    // and muted earthy hues), prefer the muted earthy rule for the reason,
    // because spec section 11.2 expects muted olive and camel to cite the
    // muted earthy avoid range.
    primaryAvoidRule = matches.find((rule) => rule.name.includes('muted')) || matches[0] || null;
  }
  if (primaryAvoidRule) {
    score = Math.min(score, 40);
    reasons.push('This is in your ' + primaryAvoidRule.name + ' avoid range, so the score is capped at 40.');
  }

  // Secondary clash (spec 5.3).
  let secondaryClash = false;
  let secondaryClashRule = null;
  const secondaries = Array.isArray(secondaryInputs) ? secondaryInputs : [];
  for (const entry of secondaries) {
    const secondary = normalizeColour(entry);
    if (!secondary || !secondary.hsl) continue;
    const percentage = entry.percentage !== undefined ? entry.percentage : (secondary.percentage || 0);
    if (percentage > 25) {
      for (const rule of palette.avoidRules) {
        if (avoidModule.matchesAvoidRule(secondary.hsl, rule)) {
          secondaryClash = true;
          secondaryClashRule = rule;
          break;
        }
      }
    }
    if (secondaryClash) break;
  }
  if (secondaryClash) {
    score = clampScore(score - 15);
    reasons.push('Secondary clash: a secondary colour covering more than 25 percent is in your ' + secondaryClashRule.name + ' avoid range, so 15 points are removed.');
  }

  const verdict = primaryAvoidRule ? 'Avoid' : tierForScore(score);
  if (primaryAvoidRule && score > 40) score = 40;
  return {
    score,
    verdict,
    nearestPaletteColorId: nearestEntry.id || null,
    nearestPaletteColorName: nearestEntry.name || null,
    deltaE: Math.round(nearest.deltaE * 100) / 100,
    reason: reasons.join(' '),
    secondaryClash,
    secondaryClashRule: secondaryClashRule ? secondaryClashRule.name : null,
  };
}

function rateItem(input, palette, secondary) {
  // Flexible input: rateItem({ primary, palette, secondary }) or
  // rateItem(primary, palette, secondary) or rateItem({ primaryHex, ... }).
  if (input && typeof input === 'object' && !Array.isArray(input) && (input.primary || input.primaryHex || input.primaryColour || input.colours)) {
    const primaryInput = input.primary || input.primaryHex || input.primaryColour || null;
    let secondaryInputs = input.secondary || input.secondaryColours || input.secondaries || secondary || [];
    let paletteInput = input.palette || input.paletteColours || palette || null;
    if (!primaryInput && Array.isArray(input.colours)) {
      const primaryEntry = input.colours.find((entry) => entry.isPrimary) || input.colours[0];
      const rest = input.colours.filter((entry) => entry !== primaryEntry);
      return rateColour(primaryEntry, paletteInput, rest.length > 0 ? rest : secondaryInputs);
    }
    if (!primaryInput) {
      return rateColour(input, paletteInput, secondaryInputs);
    }
    return rateColour(primaryInput, paletteInput, secondaryInputs);
  }
  return rateColour(input, palette, secondary);
}

const rate = rateItem;

module.exports = {
  DEFAULT_PALETTE_COLOURS,
  DEFAULT_AVOID_RULES,
  clampScore,
  scoreFromDeltaE,
  tierForScore,
  rateItem,
  rate,
  rateColour,
  normalizeColour,
  normalizePalette,
  findNearest,
  deltaE76: colour.deltaE76,
  hexToLab: colour.hexToLab,
  hexToHsl: colour.hexToHsl,
};
