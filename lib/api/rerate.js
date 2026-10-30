// Palette re-rate handler (refs ISSUE-05, spec section 4.3 step 5).
// Saving a new palette version does not delete items. Re-rating updates
// every non deleted item against the given palette, keeping previous
// palette versions intact. An item with a manual score keeps its manual
// score as its effective score; its auto score is still updated.
// Items with no primary colour are skipped and counted as skipped.
// No em dashes are used in this file.
'use strict';

const { ok } = require('./http');
const { now } = require('./store');
const { assertOwner } = require('./ownership');
const itemColours = require('./item-colours');
const rating = require('../rating');

async function reratePalette(ctx) {
  const palette = await ctx.db.get('palettes', ctx.params.id);
  assertOwner(palette, ctx.user.id);
  const colours = (await ctx.db.list('paletteColours', ctx.user.id)).filter((item) => item.paletteId === palette.id);
  const avoidRules = (await ctx.db.list('avoidRules', ctx.user.id)).filter((item) => item.paletteId === palette.id);
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
  const items = (await ctx.db.list('items', ctx.user.id)).filter((item) => !item.deletedAt);
  let reratedCount = 0;
  let skippedCount = 0;
  for (const item of items) {
    const itemColourList = await itemColours.loadColours(ctx.db, item.id, ctx.user.id);
    const primary = itemColourList.find((entry) => entry.isPrimary);
    if (!primary) {
      skippedCount += 1;
      continue;
    }
    const secondaries = itemColourList.filter((entry) => !entry.isPrimary);
    const result = rating.rateColour(primary, paletteInput, secondaries);
    if (!result || result.score === null) {
      skippedCount += 1;
      continue;
    }
    const rated = itemColours.applyRatingToItem(item, result);
    await ctx.db.update('items', item.id, {
      autoScore: rated.autoScore,
      paletteScore: rated.paletteScore,
      paletteVerdict: rated.paletteVerdict,
      nearestPaletteColorId: rated.nearestPaletteColorId,
      nearestPaletteColorName: rated.nearestPaletteColorName,
      ratingReason: rated.ratingReason,
      updatedAt: now(),
    });
    reratedCount += 1;
  }
  return ok({
    paletteId: palette.id,
    reratedCount,
    skippedCount,
    totalCount: items.length,
  });
}

module.exports = { reratePalette };
