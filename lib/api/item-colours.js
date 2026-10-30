// Item colour helpers shared by item CRUD (ISSUE-06) and the item colour
// subresource (ISSUE-07). Item colours are the up to 3 dominant colours
// from spec section 5.2, stored in hex and Lab with percentages.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const colour = require('../colour');
const rating = require('../rating');

function validateColourSet(colours) {
  if (!Array.isArray(colours)) return { colours: 'colours must be an array.' };
  if (colours.length > 3) return { colours: 'At most 3 dominant colours are allowed.' };
  const details = {};
  let primaryCount = 0;
  colours.forEach((entry, index) => {
    if (!validate.isPlainObject(entry)) {
      details['colours[' + index + ']'] = 'Each colour must be an object.';
      return;
    }
    const hexProblem = validate.checkHex(entry.hex, 'hex', { required: true });
    if (hexProblem) details['colours[' + index + '].hex'] = hexProblem;
    const pctProblem = validate.checkNumber(entry.percentage, 'percentage', { required: true, min: 0, max: 100 });
    if (pctProblem) details['colours[' + index + '].percentage'] = pctProblem;
    if (entry.isPrimary === true) primaryCount += 1;
    if (entry.isPrimary !== undefined && entry.isPrimary !== null && typeof entry.isPrimary !== 'boolean') {
      details['colours[' + index + '].isPrimary'] = 'isPrimary must be a boolean.';
    }
  });
  if (primaryCount > 1) details.colours = 'At most one colour may be primary.';
  return Object.keys(details).length > 0 ? details : null;
}

function normalizeColourSet(colours, itemId, userId, nowFn) {
  // Returns stored colour records. If no entry is marked primary, the
  // highest percentage entry becomes primary.
  const entries = colours.map((entry) => {
    const derived = colour.deriveFromHex(entry.hex);
    return {
      hex: entry.hex,
      labL: entry.labL === undefined ? derived.lab.l : entry.labL,
      labA: entry.labA === undefined ? derived.lab.a : entry.labA,
      labB: entry.labB === undefined ? derived.lab.b : entry.labB,
      percentage: entry.percentage,
      isPrimary: entry.isPrimary === true,
      family: entry.family || derived.family,
    };
  });
  if (entries.length > 0 && !entries.some((entry) => entry.isPrimary)) {
    let best = entries[0];
    for (const entry of entries) {
      if (entry.percentage > best.percentage) best = entry;
    }
    best.isPrimary = true;
  }
  return entries;
}

async function saveColourSet(db, itemId, userId, colours, nowFn) {
  const existing = (await db.list('itemColours', userId)).filter((item) => item.itemId === itemId);
  for (const entry of existing) {
    await db.delete('itemColours', entry.id);
  }
  const records = [];
  const normalized = normalizeColourSet(colours, itemId, userId, nowFn);
  const { newId } = require('./store');
  for (const entry of normalized) {
    const record = {
      id: newId(),
      userId,
      itemId,
      hex: entry.hex,
      labL: entry.labL,
      labA: entry.labA,
      labB: entry.labB,
      percentage: entry.percentage,
      isPrimary: entry.isPrimary,
      family: entry.family,
      createdAt: nowFn(),
    };
    await db.insert('itemColours', record);
    records.push(record);
  }
  return records;
}

async function loadColours(db, itemId, userId) {
  return (await db.list('itemColours', userId)).filter((item) => item.itemId === itemId);
}

async function loadActivePalette(db, userId) {
  const palettes = await db.list('palettes', userId);
  return palettes.find((palette) => palette.isActive) || null;
}

async function rateAgainstActivePalette(db, userId, primaryColour, secondaryColours) {
  const palette = await loadActivePalette(db, userId);
  if (!palette) return null;
  const colours = (await db.list('paletteColours', userId)).filter((item) => item.paletteId === palette.id);
  const avoidRules = (await db.list('avoidRules', userId)).filter((item) => item.paletteId === palette.id);
  const paletteInput = {
    colours: colours.map((item) => ({
      id: item.id,
      name: item.name,
      hex: item.hex,
      lab: { l: item.labL, a: item.labA, b: item.labB },
      hsl: { h: item.hue, s: item.saturation, l: item.lightness },
      family: item.family,
      role: item.role,
    })),
    avoidRules: avoidRules.length > 0 ? avoidRules : undefined,
  };
  const result = rating.rateColour(primaryColour, paletteInput, secondaryColours || []);
  return result;
}

// Applies a rating result to an item patch, respecting a manual override:
// the effective paletteScore is the manual score when present, otherwise
// the auto score. The auto score is never overwritten by a manual score.
function applyRatingToItem(item, result) {
  if (!result || result.score === null) return item;
  const patch = {
    autoScore: result.score,
    paletteVerdict: result.verdict,
    nearestPaletteColorId: result.nearestPaletteColorId,
    nearestPaletteColorName: result.nearestPaletteColorName,
    ratingReason: result.reason,
  };
  if (item.manualScore !== null && item.manualScore !== undefined) {
    patch.paletteScore = item.manualScore;
  } else {
    patch.paletteScore = result.score;
  }
  return { ...item, ...patch };
}

module.exports = {
  validateColourSet,
  normalizeColourSet,
  saveColourSet,
  loadColours,
  loadActivePalette,
  rateAgainstActivePalette,
  applyRatingToItem,
};
