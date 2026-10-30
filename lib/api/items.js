// Item handlers (refs ISSUE-06).
// Uses only the repository interface, never Supabase directly.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok, created, costPerWear } = require('./http');
const { newId, now } = require('./store');
const { assertOwner } = require('./ownership');
const { getStorageProvider } = require('../storage/index');
const itemColours = require('./item-colours');

const SEASONS = ['winter', 'spring', 'autumn', 'summer', 'all-season'];
const STATUSES = ['in rotation', 'stored', 'archived'];
const VERDICTS = ['Perfect', 'Strong', 'Works', 'Avoid'];

function validateItemBody(body, partial) {
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['name', partial && body.name === undefined ? null : validate.checkRequiredString(body.name, 'name', 200)],
    ['category', partial && body.category === undefined ? null : validate.checkRequiredString(body.category, 'category', 100)],
    ['season', partial && body.season === undefined ? null : validate.checkEnum(body.season, 'season', SEASONS, { required: !partial })],
    ['fitTags', validate.checkStringArray(body.fitTags, 'fitTags', 100)],
    ['status', partial && body.status === undefined ? null : validate.checkEnum(body.status, 'status', STATUSES, {})],
    ['price', body.price === undefined || body.price === null ? null : validate.checkNumber(body.price, 'price', { min: 0 })],
    ['location', body.location === undefined || body.location === null ? null : validate.checkString(body.location, 'location', { maxLength: 200 })],
    ['photoPath', body.photoPath === undefined || body.photoPath === null ? null : validate.checkString(body.photoPath, 'photoPath', { maxLength: 500 })],
    ['thumbnailPath', body.thumbnailPath === undefined || body.thumbnailPath === null ? null : validate.checkString(body.thumbnailPath, 'thumbnailPath', { maxLength: 500 })],
    ['primaryColorHex', body.primaryColorHex === undefined || body.primaryColorHex === null ? null : validate.checkHex(body.primaryColorHex, 'primaryColorHex', {})],
    ['paletteScore', body.paletteScore === undefined || body.paletteScore === null ? null : validate.checkNumber(body.paletteScore, 'paletteScore', { min: 0, max: 100 })],
    ['paletteVerdict', body.paletteVerdict === undefined || body.paletteVerdict === null ? null : validate.checkEnum(body.paletteVerdict, 'paletteVerdict', VERDICTS, {})],
    ['nearestPaletteColorId', body.nearestPaletteColorId === undefined || body.nearestPaletteColorId === null ? null : validate.checkString(body.nearestPaletteColorId, 'nearestPaletteColorId', {})],
    ['nearestPaletteColorName', body.nearestPaletteColorName === undefined || body.nearestPaletteColorName === null ? null : validate.checkString(body.nearestPaletteColorName, 'nearestPaletteColorName', { maxLength: 100 })],
    ['ratingReason', body.ratingReason === undefined || body.ratingReason === null ? null : validate.checkString(body.ratingReason, 'ratingReason', { maxLength: 1000 })],
    ['autoScore', body.autoScore === undefined || body.autoScore === null ? null : validate.checkNumber(body.autoScore, 'autoScore', { min: 0, max: 100 })],
    ['manualScore', body.manualScore === undefined || body.manualScore === null ? null : validate.checkNumber(body.manualScore, 'manualScore', { min: 0, max: 100 })],
    ['manualScoreNote', body.manualScoreNote === undefined || body.manualScoreNote === null ? null : validate.checkString(body.manualScoreNote, 'manualScoreNote', { maxLength: 500 })],
  ]);
  if (details) throw errors.validationError(details);
  if (body.colours !== undefined) {
    const colourDetails = itemColours.validateColourSet(body.colours);
    if (colourDetails) throw errors.validationError(colourDetails);
  }
}

async function loadItem(ctx, allowDeleted) {
  const record = await ctx.db.get('items', ctx.params.id);
  assertOwner(record, ctx.user.id);
  if (!allowDeleted && record.deletedAt) throw errors.notFound('Resource not found.');
  return record;
}

async function itemWithDetails(ctx, item, includeColours) {
  const view = { ...item, costPerWear: costPerWear(item) };
  if (includeColours) {
    view.colours = await itemColours.loadColours(ctx.db, item.id, ctx.user.id);
  }
  // Signed URLs are generated on read, never stored. If the provider has
  // no file for a path, the URL fields stay null instead of failing the read.
  const provider = getStorageProvider();
  if (item.photoPath) {
    try {
      const signed = await provider.getSignedUrl(item.photoPath, 3600);
      view.photoSignedUrl = signed.signedUrl;
    } catch (error) {
      view.photoSignedUrl = null;
    }
  } else {
    view.photoSignedUrl = null;
  }
  if (item.thumbnailPath) {
    try {
      const signed = await provider.getSignedUrl(item.thumbnailPath, 3600);
      view.thumbnailSignedUrl = signed.signedUrl;
    } catch (error) {
      view.thumbnailSignedUrl = null;
    }
  } else {
    view.thumbnailSignedUrl = null;
  }
  return view;
}

async function createItem(ctx) {
  validateItemBody(ctx.body, false);
  const body = ctx.body;
  const item = {
    id: newId(),
    userId: ctx.user.id,
    name: body.name,
    category: body.category,
    season: body.season,
    fitTags: body.fitTags || [],
    status: body.status || 'in rotation',
    price: body.price === undefined ? null : body.price,
    location: body.location === undefined ? null : body.location,
    photoPath: body.photoPath === undefined ? null : body.photoPath,
    thumbnailPath: body.thumbnailPath === undefined ? null : body.thumbnailPath,
    primaryColorHex: body.primaryColorHex === undefined ? null : body.primaryColorHex,
    paletteScore: body.paletteScore === undefined ? null : body.paletteScore,
    paletteVerdict: body.paletteVerdict === undefined ? null : body.paletteVerdict,
    nearestPaletteColorId: body.nearestPaletteColorId === undefined ? null : body.nearestPaletteColorId,
    nearestPaletteColorName: body.nearestPaletteColorName === undefined ? null : body.nearestPaletteColorName,
    ratingReason: body.ratingReason === undefined ? null : body.ratingReason,
    autoScore: body.autoScore === undefined ? null : body.autoScore,
    manualScore: body.manualScore === undefined ? null : body.manualScore,
    manualScoreNote: body.manualScoreNote === undefined ? null : body.manualScoreNote,
    wearCount: 0,
    lastWornAt: null,
    deletedAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
  await ctx.db.insert('items', item);
  let colours = [];
  if (body.colours) {
    colours = await itemColours.saveColourSet(ctx.db, item.id, ctx.user.id, body.colours, now);
    const primary = colours.find((entry) => entry.isPrimary);
    if (primary) {
      item.primaryColorHex = primary.hex;
      // Auto rate when colours are given and no explicit score was supplied.
      if (body.paletteScore === undefined && body.autoScore === undefined) {
        const secondaries = colours.filter((entry) => !entry.isPrimary);
        const result = await itemColours.rateAgainstActivePalette(ctx.db, ctx.user.id, primary, secondaries);
        if (result && result.score !== null) {
          const rated = itemColours.applyRatingToItem(item, result);
          Object.assign(item, rated);
          await ctx.db.update('items', item.id, item);
        } else {
          await ctx.db.update('items', item.id, { primaryColorHex: item.primaryColorHex, updatedAt: now() });
        }
      } else {
        await ctx.db.update('items', item.id, { primaryColorHex: item.primaryColorHex, updatedAt: now() });
      }
    }
  }
  const view = await itemWithDetails(ctx, item, true);
  view.colours = colours;
  return created(view);
}

async function listItems(ctx) {
  const pagination = validate.parsePagination(ctx.query);
  if (ctx.query.paletteVerdict !== undefined && !VERDICTS.includes(ctx.query.paletteVerdict)) {
    throw errors.validationError({ paletteVerdict: 'paletteVerdict must be one of: Perfect, Strong, Works, Avoid.' });
  }
  if (ctx.query.season !== undefined && !SEASONS.includes(ctx.query.season)) {
    throw errors.validationError({ season: 'season must be one of: winter, spring, autumn, summer, all-season.' });
  }
  if (ctx.query.status !== undefined && !STATUSES.includes(ctx.query.status)) {
    throw errors.validationError({ status: 'status must be one of: in rotation, stored, archived.' });
  }
  let items = (await ctx.db.list('items', ctx.user.id)).filter((item) => !item.deletedAt);
  if (ctx.query.category !== undefined) items = items.filter((item) => item.category === ctx.query.category);
  if (ctx.query.paletteVerdict !== undefined) items = items.filter((item) => item.paletteVerdict === ctx.query.paletteVerdict);
  if (ctx.query.season !== undefined) items = items.filter((item) => item.season === ctx.query.season);
  if (ctx.query.fitTag !== undefined) items = items.filter((item) => (item.fitTags || []).includes(ctx.query.fitTag));
  if (ctx.query.status !== undefined) items = items.filter((item) => item.status === ctx.query.status);
  if (ctx.query.search !== undefined) {
    const needle = ctx.query.search.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(needle) || (item.fitTags || []).some((tag) => tag.toLowerCase().includes(needle)));
  }
  if (ctx.query.colourFamily !== undefined) {
    const family = ctx.query.colourFamily.toLowerCase();
    const filtered = [];
    for (const item of items) {
      const colours = await itemColours.loadColours(ctx.db, item.id, ctx.user.id);
      const primary = colours.find((entry) => entry.isPrimary);
      if (primary && primary.family && primary.family.toLowerCase() === family) filtered.push(item);
    }
    items = filtered;
  }
  if (ctx.query.sort === 'paletteScore') items.sort((a, b) => (b.paletteScore ?? -1) - (a.paletteScore ?? -1));
  else if (ctx.query.sort === 'wearCount') items.sort((a, b) => a.wearCount - b.wearCount);
  else if (ctx.query.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
  else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const page = validate.paginate(items, pagination);
  page.data = page.data.map((item) => ({ ...item, costPerWear: costPerWear(item) }));
  return ok(page);
}

async function getItem(ctx) {
  const item = await loadItem(ctx, false);
  return ok(await itemWithDetails(ctx, item, true));
}

async function updateItem(ctx) {
  validateItemBody(ctx.body, true);
  const item = await loadItem(ctx, false);
  const body = ctx.body;
  const patch = { updatedAt: now() };
  for (const field of ['name', 'category', 'season', 'fitTags', 'status', 'price', 'location', 'photoPath', 'thumbnailPath', 'primaryColorHex', 'paletteScore', 'paletteVerdict', 'nearestPaletteColorId', 'nearestPaletteColorName', 'ratingReason', 'autoScore', 'manualScoreNote']) {
    if (body[field] !== undefined) patch[field] = body[field];
  }
  if (body.manualScore !== undefined) {
    patch.manualScore = body.manualScore;
    if (body.manualScore === null) {
      patch.paletteScore = item.autoScore !== undefined ? item.autoScore : null;
    } else {
      patch.paletteScore = body.manualScore;
    }
  }
  const updated = await ctx.db.update('items', item.id, patch);
  return ok(await itemWithDetails(ctx, updated, true));
}

async function deleteItem(ctx) {
  const item = await loadItem(ctx, false);
  await ctx.db.update('items', item.id, { deletedAt: now(), status: 'archived', updatedAt: now() });
  return ok({ deleted: true, id: item.id, softDeleted: true });
}

async function restoreItem(ctx) {
  const item = await loadItem(ctx, true);
  if (!item.deletedAt) throw errors.validationError({ id: 'Item is not deleted.' });
  const days = (Date.now() - new Date(item.deletedAt).getTime()) / (24 * 60 * 60 * 1000);
  if (days > 30) throw errors.validationError({ id: 'The 30 day restore window has passed. Use permanent delete instead.' });
  const updated = await ctx.db.update('items', item.id, { deletedAt: null, status: 'in rotation', updatedAt: now() });
  return ok(await itemWithDetails(ctx, updated, true));
}

async function permanentDeleteItem(ctx) {
  const item = await loadItem(ctx, true);
  if (!item.deletedAt) throw errors.validationError({ id: 'Item must be soft deleted before permanent delete.' });
  const colours = await itemColours.loadColours(ctx.db, item.id, ctx.user.id);
  for (const entry of colours) {
    await ctx.db.delete('itemColours', entry.id);
  }
  const outfitItems = await ctx.db.list('outfitItems', ctx.user.id);
  for (const entry of outfitItems.filter((record) => record.itemId === item.id)) {
    await ctx.db.delete('outfitItems', entry.outfitId + ':' + entry.itemId);
  }
  await ctx.db.delete('items', item.id);
  return ok({ deleted: true, id: item.id, softDeleted: false });
}

module.exports = {
  SEASONS,
  STATUSES,
  VERDICTS,
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  restoreItem,
  permanentDeleteItem,
  loadItem,
  itemWithDetails,
};
