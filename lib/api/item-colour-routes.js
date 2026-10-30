// Item colour subresource routes (refs ISSUE-07).
// GET returns the up to 3 dominant colours for an item. POST replaces the
// full set. After replacement, if the item has no manual score and the user
// has an active palette, the item is re-rated against that palette. If the
// set is empty, the item primary colour and scores are cleared to null.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok } = require('./http');
const { now } = require('./store');
const { assertOwner } = require('./ownership');
const itemColours = require('./item-colours');

async function loadItemForColours(ctx) {
  const record = await ctx.db.get('items', ctx.params.itemId);
  assertOwner(record, ctx.user.id);
  if (record.deletedAt) throw errors.notFound('Resource not found.');
  return record;
}

async function listItemColours(ctx) {
  const item = await loadItemForColours(ctx);
  const pagination = validate.parsePagination(ctx.query);
  const colours = await itemColours.loadColours(ctx.db, item.id, ctx.user.id);
  return ok(validate.paginate(colours, pagination));
}

async function replaceItemColours(ctx) {
  const item = await loadItemForColours(ctx);
  const body = ctx.body || {};
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  if (body.colours === undefined) throw errors.validationError({ colours: 'colours is required.' });
  const details = itemColours.validateColourSet(body.colours);
  if (details) throw errors.validationError(details);
  const colours = await itemColours.saveColourSet(ctx.db, item.id, ctx.user.id, body.colours, now);
  if (colours.length === 0) {
    await ctx.db.update('items', item.id, {
      primaryColorHex: null,
      paletteScore: null,
      paletteVerdict: null,
      nearestPaletteColorId: null,
      nearestPaletteColorName: null,
      ratingReason: null,
      autoScore: null,
      updatedAt: now(),
    });
  } else {
    const primary = colours.find((entry) => entry.isPrimary);
    const patch = { primaryColorHex: primary ? primary.hex : null, updatedAt: now() };
    if (item.manualScore === null || item.manualScore === undefined) {
      const secondaries = colours.filter((entry) => !entry.isPrimary);
      const result = await itemColours.rateAgainstActivePalette(ctx.db, ctx.user.id, primary, secondaries);
      if (result && result.score !== null) {
        const rated = itemColours.applyRatingToItem(item, result);
        patch.autoScore = rated.autoScore;
        patch.paletteScore = rated.paletteScore;
        patch.paletteVerdict = rated.paletteVerdict;
        patch.nearestPaletteColorId = rated.nearestPaletteColorId;
        patch.nearestPaletteColorName = rated.nearestPaletteColorName;
        patch.ratingReason = rated.ratingReason;
      }
    }
    await ctx.db.update('items', item.id, patch);
  }
  const pagination = validate.parsePagination(ctx.query);
  return ok(validate.paginate(colours, pagination));
}

module.exports = { listItemColours, replaceItemColours };
