// Outfit and outfit item handlers (refs ISSUE-13).
// An outfit has at most one item per slot. Empty slots are allowed.
// Outfit item records in the memory store are keyed by "outfitId:itemId".
// The Supabase repository translates that key to the composite primary key.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok, created } = require('./http');
const { newId, now } = require('./store');
const { assertOwner } = require('./ownership');
const { SEASONS } = require('./items');

const OCCASIONS = ['daily', 'interview', 'formal', 'japan-travel', 'date-evening'];
const VIBES = ['structured-softboy', 'clean-minimal', 'light-old-money', 'streetwear-minimal'];
const SLOTS = ['base-top', 'outer-layer', 'bottom', 'shoes', 'accessory'];

function outfitItemKey(outfitId, itemId) {
  return outfitId + ':' + itemId;
}

async function loadOutfitItems(db, outfitId, userId) {
  const all = await db.list('outfitItems', userId);
  return all.filter((entry) => entry.outfitId === outfitId);
}

async function outfitWithItems(db, outfit) {
  const entries = await loadOutfitItems(db, outfit.id, outfit.userId);
  const items = [];
  for (const entry of entries) {
    const item = await db.get('items', entry.itemId);
    items.push({
      outfitId: entry.outfitId,
      itemId: entry.itemId,
      slot: entry.slot,
      itemName: item ? item.name : null,
      createdAt: entry.createdAt,
    });
  }
  return { ...outfit, items };
}

function validateOutfitBody(body, partial) {
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['occasion', partial && body.occasion === undefined ? null : validate.checkEnum(body.occasion, 'occasion', OCCASIONS, { required: !partial })],
    ['season', partial && body.season === undefined ? null : validate.checkEnum(body.season, 'season', SEASONS, { required: !partial })],
    ['vibe', body.vibe === undefined || body.vibe === null ? null : validate.checkEnum(body.vibe, 'vibe', VIBES, {})],
    ['paletteScore', body.paletteScore === undefined || body.paletteScore === null ? null : validate.checkNumber(body.paletteScore, 'paletteScore', { min: 0, max: 100 })],
    ['fitScore', body.fitScore === undefined || body.fitScore === null ? null : validate.checkNumber(body.fitScore, 'fitScore', { min: 0, max: 100 })],
    ['contrastScore', body.contrastScore === undefined || body.contrastScore === null ? null : validate.checkNumber(body.contrastScore, 'contrastScore', { min: 0, max: 100 })],
    ['rotationScore', body.rotationScore === undefined || body.rotationScore === null ? null : validate.checkNumber(body.rotationScore, 'rotationScore', { min: 0, max: 100 })],
    ['totalScore', body.totalScore === undefined || body.totalScore === null ? null : validate.checkNumber(body.totalScore, 'totalScore', { min: 0, max: 100 })],
    ['explanation', validate.checkStringArray(body.explanation, 'explanation', 100)],
    ['saved', validate.checkBoolean(body.saved, 'saved')],
  ]);
  if (details) throw errors.validationError(details);
}

async function validateOutfitItemEntries(db, userId, entries) {
  if (entries === undefined) return;
  if (!Array.isArray(entries)) throw errors.validationError({ items: 'items must be an array.' });
  const slots = new Set();
  const itemIds = new Set();
  for (const entry of entries) {
    if (!validate.isPlainObject(entry)) throw errors.validationError({ items: 'Each outfit item must be an object with itemId and slot.' });
    if (!SLOTS.includes(entry.slot)) {
      throw errors.validationError({ items: 'slot must be one of: base-top, outer-layer, bottom, shoes, accessory.' });
    }
    if (slots.has(entry.slot)) throw errors.validationError({ items: 'Duplicate slot in one outfit: ' + entry.slot + '.' });
    slots.add(entry.slot);
    if (itemIds.has(entry.itemId)) throw errors.validationError({ items: 'Duplicate item in one outfit.' });
    itemIds.add(entry.itemId);
    const item = await db.get('items', entry.itemId);
    if (!item) throw errors.validationError({ items: 'Item does not exist: ' + entry.itemId + '.' });
    if (item.userId !== userId) throw errors.forbidden('This item belongs to another user.');
    if (item.deletedAt) throw errors.validationError({ items: 'Item is deleted: ' + entry.itemId + '.' });
  }
}

async function createOutfit(ctx) {
  validateOutfitBody(ctx.body, false);
  await validateOutfitItemEntries(ctx.db, ctx.user.id, ctx.body.items);
  const body = ctx.body;
  const outfit = {
    id: newId(),
    userId: ctx.user.id,
    occasion: body.occasion,
    season: body.season,
    vibe: body.vibe === undefined ? null : body.vibe,
    paletteScore: body.paletteScore === undefined ? null : body.paletteScore,
    fitScore: body.fitScore === undefined ? null : body.fitScore,
    contrastScore: body.contrastScore === undefined ? null : body.contrastScore,
    rotationScore: body.rotationScore === undefined ? null : body.rotationScore,
    totalScore: body.totalScore === undefined ? null : body.totalScore,
    explanation: body.explanation || [],
    saved: body.saved === true,
    createdAt: now(),
    updatedAt: now(),
  };
  await ctx.db.insert('outfits', outfit);
  for (const entry of body.items || []) {
    const record = {
      id: outfitItemKey(outfit.id, entry.itemId),
      userId: ctx.user.id,
      outfitId: outfit.id,
      itemId: entry.itemId,
      slot: entry.slot,
      createdAt: now(),
    };
    await ctx.db.insert('outfitItems', record);
  }
  return created(await outfitWithItems(ctx.db, outfit));
}

async function listOutfits(ctx) {
  const pagination = validate.parsePagination(ctx.query);
  let outfits = await ctx.db.list('outfits', ctx.user.id);
  if (ctx.query.occasion !== undefined) {
    if (!OCCASIONS.includes(ctx.query.occasion)) throw errors.validationError({ occasion: 'occasion must be one of: daily, interview, formal, japan-travel, date-evening.' });
    outfits = outfits.filter((item) => item.occasion === ctx.query.occasion);
  }
  if (ctx.query.saved !== undefined) {
    const parsed = validate.parseBooleanQuery(ctx.query.saved);
    if (parsed === null) throw errors.validationError({ saved: 'saved must be true or false.' });
    outfits = outfits.filter((item) => item.saved === parsed);
  }
  if (ctx.query.sort === 'totalScore') outfits.sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));
  else outfits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return ok(validate.paginate(outfits, pagination));
}

async function loadOutfit(ctx) {
  const record = await ctx.db.get('outfits', ctx.params.id || ctx.params.outfitId);
  return assertOwner(record, ctx.user.id);
}

async function getOutfit(ctx) {
  const outfit = await loadOutfit(ctx);
  return ok(await outfitWithItems(ctx.db, outfit));
}

async function updateOutfit(ctx) {
  validateOutfitBody(ctx.body, true);
  const outfit = await loadOutfit(ctx);
  const patch = { updatedAt: now() };
  for (const field of ['occasion', 'season', 'vibe', 'paletteScore', 'fitScore', 'contrastScore', 'rotationScore', 'totalScore', 'explanation', 'saved']) {
    if (ctx.body[field] !== undefined) patch[field] = ctx.body[field];
  }
  const updated = await ctx.db.update('outfits', outfit.id, patch);
  return ok(await outfitWithItems(ctx.db, updated));
}

async function deleteOutfit(ctx) {
  const outfit = await loadOutfit(ctx);
  const entries = await loadOutfitItems(ctx.db, outfit.id, ctx.user.id);
  for (const entry of entries) {
    await ctx.db.delete('outfitItems', outfitItemKey(outfit.id, entry.itemId));
  }
  await ctx.db.delete('outfits', outfit.id);
  return ok({ deleted: true, id: outfit.id });
}

async function listOutfitItems(ctx) {
  const outfit = await loadOutfit(ctx);
  const pagination = validate.parsePagination(ctx.query);
  const entries = await loadOutfitItems(ctx.db, outfit.id, ctx.user.id);
  const items = [];
  for (const entry of entries) {
    const item = await ctx.db.get('items', entry.itemId);
    items.push({
      outfitId: entry.outfitId,
      itemId: entry.itemId,
      slot: entry.slot,
      itemName: item ? item.name : null,
      createdAt: entry.createdAt,
    });
  }
  return ok(validate.paginate(items, pagination));
}

async function addOutfitItem(ctx) {
  const outfit = await loadOutfit(ctx);
  const body = ctx.body || {};
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['itemId', validate.checkRequiredString(body.itemId, 'itemId', 200)],
    ['slot', validate.checkEnum(body.slot, 'slot', SLOTS, { required: true })],
  ]);
  if (details) throw errors.validationError(details);
  await validateOutfitItemEntries(ctx.db, ctx.user.id, [body]);
  const existing = await loadOutfitItems(ctx.db, outfit.id, ctx.user.id);
  if (existing.some((entry) => entry.slot === body.slot)) {
    throw errors.validationError({ items: 'Duplicate slot in one outfit: ' + body.slot + '.' });
  }
  const record = {
    id: outfitItemKey(outfit.id, body.itemId),
    userId: ctx.user.id,
    outfitId: outfit.id,
    itemId: body.itemId,
    slot: body.slot,
    createdAt: now(),
  };
  await ctx.db.insert('outfitItems', record);
  const item = await ctx.db.get('items', body.itemId);
  return created({
    outfitId: outfit.id,
    itemId: body.itemId,
    slot: body.slot,
    itemName: item ? item.name : null,
    createdAt: record.createdAt,
  });
}

async function removeOutfitItem(ctx) {
  const outfit = await loadOutfit(ctx);
  const key = outfitItemKey(outfit.id, ctx.params.itemId);
  const existing = await ctx.db.get('outfitItems', key);
  if (!existing) throw errors.notFound('Resource not found.');
  assertOwner(existing, ctx.user.id);
  await ctx.db.delete('outfitItems', key);
  return ok({ deleted: true, outfitId: outfit.id, itemId: ctx.params.itemId });
}

module.exports = {
  OCCASIONS,
  VIBES,
  SLOTS,
  outfitItemKey,
  createOutfit,
  listOutfits,
  getOutfit,
  updateOutfit,
  deleteOutfit,
  listOutfitItems,
  addOutfitItem,
  removeOutfitItem,
};
