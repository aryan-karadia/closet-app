// Palette PDF ingester, browser side classification (refs ISSUE-03, ISSUE-04, spec section 4.3).
// Pure functions, no I/O, no imports from tests. Importable from Node require
// (tests/impl-gated/palette-ingester.test.js requires this exact path,
// lib/palette-ingester.js) and from TypeScript via lib/palette-ingester.d.ts.
// Beauty sections are classified as ignore and are never saved as clothing
// colours unless the user explicitly adds them. Nothing extracted here is
// final until the user approves and saves it on the correction screen.
// No em dashes are used in this file.
'use strict';

const BEAUTY_KEYWORDS = ['makeup', 'blush', 'lip', 'lipstick', 'hair', 'nail', 'facetune', 'foundation', 'eyeshadow', 'mascara', 'beauty'];
const CORE_KEYWORDS = ['core', 'best colours', 'best colors', 'do colours', 'do colors', 'signature', 'wear these'];
const NEUTRAL_KEYWORDS = ['neutral', 'neutrals'];
const AVOID_KEYWORDS = ['avoid', 'do not wear', 'dont wear', 'stay away', 'worst colours', 'worst colors'];

// Known Deep Winter names from spec section 15, plus common palette names.
// Each entry gives the default role and family used when the PDF section
// heading does not already fix the role. Section context wins over defaults.
const KNOWN_COLOURS = [
  { name: 'Royal Blue', family: 'blue', role: 'core' },
  { name: 'Emerald Green', family: 'green', role: 'core' },
  { name: 'Rich Purple', family: 'purple', role: 'core' },
  { name: 'True Red', family: 'red', role: 'core' },
  { name: 'Deep Teal', family: 'teal', role: 'core' },
  { name: 'Rich Plum', family: 'plum', role: 'core' },
  { name: 'Dark Burgundy', family: 'burgundy', role: 'core' },
  { name: 'Charcoal Gray', family: 'gray', role: 'neutral' },
  { name: 'Charcoal Grey', family: 'gray', role: 'neutral' },
  { name: 'Navy', family: 'navy', role: 'neutral' },
  { name: 'Cool Black', family: 'black', role: 'neutral' },
  { name: 'Cool White', family: 'white', role: 'neutral' },
  { name: 'Black', family: 'black', role: 'neutral' },
  { name: 'White', family: 'white', role: 'neutral' },
];

function lower(text) { return String(text || '').toLowerCase(); }

function isBeautyText(text) {
  const value = lower(text);
  return BEAUTY_KEYWORDS.some((word) => value.includes(word));
}

// Classify one heading or text block into core, neutral, avoid, or ignore.
// Beauty content is always ignore, even if it also mentions a colour word.
function classifySection(text) {
  const value = lower(text);
  if (isBeautyText(value)) return 'ignore';
  if (AVOID_KEYWORDS.some((word) => value.includes(word))) return 'avoid';
  if (NEUTRAL_KEYWORDS.some((word) => value.includes(word))) return 'neutral';
  if (CORE_KEYWORDS.some((word) => value.includes(word))) return 'core';
  return 'ignore';
}

function classifyPage(pageText) {
  return classifySection(pageText);
}

// Extract named colours from per page text, preserving page numbers.
// pages: [{ page: number, text: string }]. Returns extracted colour drafts
// with name, role, sourcePage, family, and beauty flag. A page that is
// primarily beauty content yields beauty flagged entries only, so the UI
// can show them separately and the save step can drop them by default.
function extractFromPages(pages) {
  const results = [];
  const seen = new Set();
  for (const entry of pages || []) {
    const pageNumber = entry.page || entry.pageNumber || 1;
    const text = entry.text || '';
    const lines = String(text).split(/\r?\n/);
    let section = null;
    let beautyPage = isBeautyText(text) && classifySection(text) === 'ignore' && BEAUTY_KEYWORDS.some((w) => lower(text).includes(w)) && !/core|neutral|avoid/.test(lower(text));
    // A page is treated as primarily beauty only when beauty keywords appear
    // and no palette section heading appears on the same page.
    if (beautyPage) section = 'ignore';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const sectionGuess = classifySection(line);
      if (sectionGuess !== 'ignore' || isBeautyText(line)) {
        // A heading line changes the section for the lines that follow it.
        if (/colour|color|palette|section|makeup|hair|beauty/i.test(line) || line.length < 60) {
          section = sectionGuess;
          if (isBeautyText(line)) section = 'ignore';
        }
      }
      const lineMatches = KNOWN_COLOURS.filter((k) => lower(line).includes(lower(k.name)));
      for (const known of KNOWN_COLOURS) {
        if (lower(line).includes(lower(known.name))) {
          // Skip a short name already covered by a longer name on the same
          // line, for example Black inside Cool Black.
          if (lineMatches.some((other) => other.name.length > known.name.length && lower(other.name).includes(lower(known.name)))) continue;
          const key = known.name.toLowerCase() + ':' + pageNumber;
          if (seen.has(key)) continue;
          seen.add(key);
          const beauty = section === 'ignore' && isBeautyText(line + ' ' + text);
          const role = section === 'core' || section === 'neutral' || section === 'avoid' ? section : known.role;
          results.push({
            name: known.name, family: known.family, role,
            sourcePage: pageNumber, beauty: Boolean(beauty),
            sourceSection: section, hex: null, isManual: false,
          });
        }
      }
    }
    // Avoid rules named in text, without a swatch hex: light pastels, warm
    // oranges, muted earthy hues. These are stored as avoid rules, not colours.
    const pageLower = lower(text);
    const avoidNames = [];
    if (pageLower.includes('light pastel')) avoidNames.push('light pastels');
    if (pageLower.includes('warm orange')) avoidNames.push('warm oranges');
    if (pageLower.includes('muted earth')) avoidNames.push('muted earthy hues');
    for (const name of avoidNames) {
      if (!results.some((r) => r.name.toLowerCase() === name && r.role === 'avoid')) {
        results.push({ name, family: 'other', role: 'avoid', sourcePage: pageNumber, beauty: false, sourceSection: 'avoid', hex: null, isManual: false, isAvoidRule: true });
      }
    }
  }
  return results;
}

function isBeautyColour(colour) {
  if (!colour) return false;
  if (colour.beauty === true) return true;
  const haystack = lower((colour.name || '') + ' ' + (colour.sourceSection || ''));
  return BEAUTY_KEYWORDS.some((word) => haystack.includes(word));
}

// Remove beauty colours, returning kept and removed lists so the UI can undo.
function removeBeautyColours(colours) {
  const kept = [];
  const removed = [];
  for (const colour of colours || []) {
    if (isBeautyColour(colour)) removed.push(colour);
    else kept.push(colour);
  }
  return { kept, removed, removedCount: removed.length };
}

function summarizeColours(colours) {
  const counts = { core: 0, neutral: 0, avoid: 0 };
  for (const colour of colours || []) {
    if (counts[colour.role] !== undefined) counts[colour.role] += 1;
  }
  const warnings = [];
  if (counts.neutral === 0) warnings.push('Warning: zero neutrals. The extraction may have missed a section.');
  if (counts.avoid === 0) warnings.push('Warning: zero avoids. The extraction may have missed a section.');
  return { core: counts.core, neutral: counts.neutral, avoid: counts.avoid, total: (colours || []).length, warnings };
}

// Correction helpers used by the correction screen (ISSUE-04). They are pure
// list operations: nothing is saved until the user approves and saves.
function renameColour(colours, idOrIndex, name) {
  return (colours || []).map((c, i) => (c.id === idOrIndex || i === idOrIndex ? { ...c, name } : c));
}
function changeRole(colours, idOrIndex, role) {
  return (colours || []).map((c, i) => (c.id === idOrIndex || i === idOrIndex ? { ...c, role } : c));
}
function changeHex(colours, idOrIndex, hex) {
  return (colours || []).map((c, i) => (c.id === idOrIndex || i === idOrIndex ? { ...c, hex } : c));
}
function deleteColour(colours, idOrIndex) {
  return (colours || []).filter((c, i) => !(c.id === idOrIndex || i === idOrIndex));
}

module.exports = {
  BEAUTY_KEYWORDS, KNOWN_COLOURS,
  isBeautyText, isBeautyColour, classifySection, classifyPage,
  extractFromPages, removeBeautyColours, summarizeColours,
  renameColour, changeRole, changeHex, deleteColour,
};
