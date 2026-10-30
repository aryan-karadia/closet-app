// Browser rule engine, pruned beam search (refs ISSUE-16, spec sections 6.3 and 16.6).
// Pure functions, no I/O, no imports from tests, no LLM in the outfit path.
// Uses precomputed item data from the API only. Never brute forces all
// combinations: filter, anchor on the top 10 bottoms preferring neutrals,
// build up with top 10 tops, top 5 outers, top shoes and accessories,
// score, keep the top 20, then enforce diversity for the final 3.
// Importable from Node require (tests/impl-gated/outfit-engine.test.js
// requires this exact path, lib/outfit-engine/index.js, and expects a
// buildOutfits or build function) and from the browser Web Worker.
// No em dashes are used in this file.
'use strict';

function hexToHsl(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return { h: 0, s: 0, l: 50 };
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(lightness * 1000) / 10 };
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / delta + 2) * 60;
  else hue = ((r - g) / delta + 4) * 60;
  return { h: Math.round(hue * 10) / 10, s: Math.round(saturation * 1000) / 10, l: Math.round(lightness * 1000) / 10 };
}

function slotForCategory(category, name) {
  const value = String(category || '').toLowerCase();
  const label = String(name || '').toLowerCase();
  const haystack = value + ' ' + label;
  if (/(cardigan|jacket|coat|blazer)/.test(haystack)) return 'outer-layer';
  if (/(trouser|jean|chino|pant)/.test(haystack)) return 'bottom';
  if (/(shoe|boot|sneaker|loafer)/.test(haystack)) return 'shoes';
  if (/(watch|belt|bag|jewelry|jewellery|accessory|tie|scarf)/.test(haystack)) return 'accessory';
  if (/(shirt|tee|t-shirt|sweater|knit|hoodie)/.test(haystack)) return 'base-top';
  return null;
}

function isNeutralItem(item) {
  const hsl = hexToHsl(item.primaryColorHex || (item.colours && item.colours[0] && item.colours[0].hex) || '');
  if (!item.primaryColorHex && !(item.colours && item.colours[0])) return false;
  // Neutrals are dark or low saturation, or a named neutral family.
  if (hsl.s < 25) return true;
  if (hsl.l < 30 && hsl.s < 60) return true;
  return false;
}

function isSaturatedAccent(item) {
  const hex = item.primaryColorHex || (item.colours && item.colours[0] && item.colours[0].hex) || '';
  if (!hex) return false;
  const hsl = hexToHsl(hex);
  if (hsl.s < 50) return false;
  if (hsl.l < 20 || hsl.l > 75) return false;
  // Navy, black, gray, and white are neutrals, not accents, even when dark.
  if (hsl.l < 32 && hsl.h >= 200 && hsl.h <= 250) return false;
  return true;
}

function isCollaredShirt(item) {
  const haystack = (String(item.category || '') + ' ' + String(item.name || '')).toLowerCase();
  if (!haystack.includes('shirt')) return false;
  if (haystack.includes('t-shirt') || haystack.includes('tee')) return false;
  return true;
}
function isWhiteOrLightNeutral(item) {
  const hex = item.primaryColorHex || '';
  if (!hex) return false;
  const hsl = hexToHsl(hex);
  return hsl.s < 25 && hsl.l >= 70;
}

function combinationKey(itemIds) {
  return [...itemIds].sort().join('|');
}

function isDisliked(combinationIds, disliked, now) {
  const key = combinationKey(combinationIds);
  const nowTime = now ? new Date(now).getTime() : Date.now();
  for (const entry of disliked || []) {
    const entryKey = typeof entry === 'string' ? entry : combinationKey(entry.ids || entry.combination || entry.itemIds || []);
    const entryTime = entry && entry.dislikedAt ? new Date(entry.dislikedAt).getTime() : (entry && entry.date ? new Date(entry.date).getTime() : null);
    if (entryKey !== key) continue;
    if (entryTime === null) return true;
    const days = (nowTime - entryTime) / (1000 * 60 * 60 * 24);
    if (days < 30) return true;
  }
  return false;
}

function ruleAppliesToSlot(rule, slot) {
  const condition = String(rule.conditionCategory || '').toLowerCase();
  if (!condition || condition === 'outfit') return true;
  if (condition.includes('base top') || condition === 'top') return slot === 'base-top';
  if (condition.includes('outer')) return slot === 'outer-layer';
  if (condition.includes('trouser') || condition.includes('jean')) return slot === 'bottom';
  if (condition.includes('accessory')) return slot === 'accessory';
  return true;
}

function scoreOutfit(slots, adviceRules) {
  const present = Object.values(slots).filter(Boolean);
  const weights = { 'base-top': 0.35, 'outer-layer': 0.25, bottom: 0.2, shoes: 0.1, accessory: 0.1 };
  let weightSum = 0; let paletteSum = 0;
  for (const [slot, item] of Object.entries(slots)) {
    if (!item) continue;
    const weight = weights[slot] || 0.1;
    weightSum += weight; paletteSum += weight * (item.paletteScore || 0);
  }
  const paletteScore = weightSum ? Math.round(paletteSum / weightSum) : 0;

  const enabled = (adviceRules || []).filter((rule) => rule.enabled === true);
  let satisfied = 0; const fired = [];
  for (const rule of enabled) {
    const tag = String(rule.conditionFitTag || '').toLowerCase();
    let matched = false;
    for (const [slot, item] of Object.entries(slots)) {
      if (!item || !ruleAppliesToSlot(rule, slot)) continue;
      if (!tag) { matched = true; break; }
      const tags = (item.fitTags || []).map((t) => String(t).toLowerCase());
      const wanted = tag.split(/\s+or\s+/).map((t) => t.trim()).filter(Boolean);
      if (wanted.some((w) => tags.some((t) => t.includes(w) || w.includes(t)))) { matched = true; break; }
    }
    if (rule.action === 'avoid') {
      if (!matched) { satisfied += 1; fired.push(rule.reason || rule.name); }
    } else if (matched) { satisfied += 1; fired.push(rule.reason || rule.name); }
  }
  const fitScore = enabled.length ? Math.round((satisfied / enabled.length) * 100) : 100;

  const lightnesses = present.map((item) => hexToHsl(item.primaryColorHex || '').l);
  const range = lightnesses.length ? Math.max(...lightnesses) - Math.min(...lightnesses) : 0;
  const contrastScore = range >= 40 ? 100 : range >= 25 ? 70 : 40;

  const avgWear = present.length ? present.reduce((s, item) => s + (item.wearCount || 0), 0) / present.length : 0;
  const rotationScore = Math.max(0, Math.round(100 - avgWear * 5));

  const totalScore = Math.round(paletteScore * 0.4 + fitScore * 0.3 + contrastScore * 0.15 + rotationScore * 0.15);
  return { paletteScore, fitScore, contrastScore, rotationScore, totalScore, firedRules: fired, lightnessRange: range };
}

function isUnrated(item) {
  return !item || item.paletteVerdict === null || item.paletteVerdict === undefined || item.paletteVerdict === '';
}

function isInterviewExcluded(item) {
  const haystack = (String(item.category || '') + ' ' + String(item.name || '')).toLowerCase();
  return haystack.includes('hoodie') || haystack.includes('graphic tee');
}

// Summary of unrated items in an outfit. Entries use the outfit shape
// { slot, item } or { slot, itemId, item }; plain items are also accepted.
// Used by buildOutfits for the warning fields, and by the UI so a
// shuffled outfit shows the same warning as a freshly built one.
function unratedSummary(entries) {
  const list = entries || [];
  const items = list.map((entry) => entry.item || entry).filter(Boolean);
  const unrated = items.filter(isUnrated);
  const unratedItemIds = unrated.map((item) => item.id).filter(Boolean);
  return {
    hasUnratedItems: unrated.length > 0,
    unratedItemIds,
    allItemsUnrated: items.length > 0 && unrated.length === items.length,
  };
}

function buildOutfits(input) {
  const options = input || {};
  const occasion = options.occasion || 'daily';
  const season = options.season || 'all-season';
  const items = options.items || [];
  const adviceRules = options.adviceRules || [];
  const disliked = options.disliked || [];
  const now = options.now || null;

  // Step 1, filter.
  const allowedVerdicts = occasion === 'interview' || occasion === 'formal'
    ? ['Perfect', 'Strong']
    : ['Perfect', 'Strong', 'Works'];
  const filtered = items.filter((item) => {
    if (item.status !== 'in rotation') return false;
    if (item.season && item.season !== 'all-season' && season !== 'all-season' && item.season !== season) return false;
    if (item.paletteVerdict && !allowedVerdicts.includes(item.paletteVerdict)) return false;
    if (occasion === 'interview' && isInterviewExcluded(item)) return false;
    return true;
  });

  // Group by slot.
  const bySlot = { 'base-top': [], 'outer-layer': [], bottom: [], shoes: [], accessory: [] };
  for (const item of filtered) {
    const slot = slotForCategory(item.category, item.name);
    if (slot && bySlot[slot]) bySlot[slot].push(item);
  }
  // ISSUE-34 decision: interview builds still reject Avoid items and
  // interview category exclusions (done above), prefer Perfect and
  // Strong items, and allow unrated items only as a fallback. Per slot,
  // if any Perfect or Strong item is available, unrated items for that
  // slot are dropped, so an unrated item is used only when no rated
  // item can fill that slot. Unrated items are never silently treated
  // as Strong: outfits that use one carry the warning fields below.
  if (occasion === 'interview') {
    for (const slot of Object.keys(bySlot)) {
      const rated = bySlot[slot].filter((item) => ['Perfect', 'Strong'].includes(item.paletteVerdict));
      if (rated.length) bySlot[slot] = rated;
    }
  }
  const byScore = (a, b) => (b.paletteScore || 0) - (a.paletteScore || 0) || (a.wearCount || 0) - (b.wearCount || 0);

  // Step 2, anchor: top 10 bottoms, preferring neutrals.
  const bottoms = [...bySlot.bottom].sort((a, b) => {
    const neutralDiff = (isNeutralItem(b) ? 1 : 0) - (isNeutralItem(a) ? 1 : 0);
    return neutralDiff !== 0 ? neutralDiff : byScore(a, b);
  }).slice(0, 10);
  if (!bottoms.length) return [];

  const candidates = [];
  for (const bottom of bottoms) {
    const bottomHsl = hexToHsl(bottom.primaryColorHex || '');
    // Tops: prefer contrast in lightness, or a saturated core if the bottom is neutral.
    let tops = [...bySlot['base-top']].sort((a, b) => {
      const aHsl = hexToHsl(a.primaryColorHex || ''); const bHsl = hexToHsl(b.primaryColorHex || '');
      const aContrast = Math.abs(aHsl.l - bottomHsl.l); const bContrast = Math.abs(bHsl.l - bottomHsl.l);
      const aBonus = isNeutralItem(bottom) && isSaturatedAccent(a) ? 20 : 0;
      const bBonus = isNeutralItem(bottom) && isSaturatedAccent(b) ? 20 : 0;
      return (bContrast + bBonus + (b.paletteScore || 0)) - (aContrast + aBonus + (a.paletteScore || 0));
    });
    if (occasion === 'interview') {
      const collared = tops.filter((t) => isCollaredShirt(t) && isWhiteOrLightNeutral(t));
      if (collared.length) tops = [...collared, ...tops.filter((t) => !collared.includes(t))];
    }
    tops = tops.slice(0, 10);
    for (const top of tops) {
      const topHsl = hexToHsl(top.primaryColorHex || '');
      let outers = [...bySlot['outer-layer']].sort((a, b) => {
        const aHsl = hexToHsl(a.primaryColorHex || ''); const bHsl = hexToHsl(b.primaryColorHex || '');
        const aDark = aHsl.l <= topHsl.l ? 10 : 0; const bDark = bHsl.l <= topHsl.l ? 10 : 0;
        return (b.paletteScore || 0) + bDark + (isNeutralItem(b) ? 10 : 0) - ((a.paletteScore || 0) + aDark + (isNeutralItem(a) ? 10 : 0));
      }).slice(0, 5);
      const outerOptions = outers.length ? outers : [null];
      for (const outer of outerOptions) {
        const shoes = [...bySlot.shoes].sort((a, b) => {
          const aHsl = hexToHsl(a.primaryColorHex || ''); const bHsl = hexToHsl(b.primaryColorHex || '');
          return Math.abs(aHsl.l - bottomHsl.l) - Math.abs(bHsl.l - bottomHsl.l) || byScore(a, b);
        }).slice(0, 5);
        const shoeOptions = shoes.length ? shoes : [null];
        for (const shoe of shoeOptions) {
          const accessories = [...bySlot.accessory].sort(byScore).slice(0, 3);
          const accessoryOptions = accessories.length ? [...accessories, null] : [null];
          for (const accessory of accessoryOptions) {
            const slots = { 'base-top': top, 'outer-layer': outer, bottom, shoes: shoe, accessory };
            // Hard rules: at most one of each slot (by construction), at most
            // one saturated accent as a main colour, interview allows none.
            const accentCount = [top, outer, accessory].filter(Boolean).filter(isSaturatedAccent).length;
            if (accentCount > 1) continue;
            if (occasion === 'interview' && accentCount > 0) continue;
            const ids = [top, outer, bottom, shoe, accessory].filter(Boolean).map((item) => item.id);
            if (isDisliked(ids, disliked, now)) continue;
            const scores = scoreOutfit(slots, adviceRules);
            const explanation = [];
            explanation.push('Dark neutral bottom anchors this outfit.' );
            if (isSaturatedAccent(top)) explanation.push('The base top gives the one saturated accent against neutrals.');
            if (scores.lightnessRange >= 40) explanation.push('Clear light and dark contrast keeps the palette high contrast.');
            else explanation.push('Contrast is modest; a lighter shoe or accessory would lift it.');
            for (const reason of scores.firedRules.slice(0, 3)) explanation.push(reason);
            if ((top.wearCount || 0) === 0 && (bottom.wearCount || 0) === 0) explanation.push('These pieces are least worn, so rotation favours them.');
            const outfitItems = Object.entries(slots).filter(([, item]) => item).map(([slot, item]) => ({ itemId: item.id, slot, item }));
            const summary = unratedSummary(outfitItems);
            if (occasion === 'interview' && summary.hasUnratedItems) {
              explanation.push('Unrated item included, palette fit not verified');
              if (summary.allItemsUnrated) explanation.push('All items are unrated, so this is not a verified interview outfit.');
            }
            candidates.push({
              items: outfitItems,
              missingSlots: Object.entries(slots).filter(([, item]) => !item).map(([slot]) => slot),
              ...scores, explanation, occasion, season,
              hasUnratedItems: summary.hasUnratedItems,
              unratedItemIds: summary.unratedItemIds,
              allItemsUnrated: summary.allItemsUnrated,
            });
          }
        }
      }
    }
  }

  // Step 4, keep the top 20, then enforce diversity for the final 3.
  candidates.sort((a, b) => b.totalScore - a.totalScore);
  const top20 = candidates.slice(0, 20);
  const finalOutfits = [];
  const seenPairs = new Set();
  for (const candidate of top20) {
    const topId = (candidate.items.find((x) => x.slot === 'base-top') || {}).itemId || 'none';
    const outerId = (candidate.items.find((x) => x.slot === 'outer-layer') || {}).itemId || 'none';
    const pair = topId + '|' + outerId;
    if (seenPairs.has(pair)) continue;
    seenPairs.add(pair);
    finalOutfits.push(candidate);
    if (finalOutfits.length >= 3) break;
  }
  // If diversity filtering leaves fewer than 3, fill from the top 20 in order.
  if (finalOutfits.length < 3) {
    for (const candidate of top20) {
      if (finalOutfits.length >= 3) break;
      if (!finalOutfits.includes(candidate)) finalOutfits.push(candidate);
    }
  }
  return finalOutfits.slice(0, 3);
}

const build = buildOutfits;

module.exports = {
  buildOutfits, build, slotForCategory, isNeutralItem, isSaturatedAccent,
  isCollaredShirt, isWhiteOrLightNeutral, combinationKey, isDisliked, scoreOutfit, hexToHsl,
  isUnrated, isInterviewExcluded, unratedSummary,
};
