// Palette and palette colour handlers (refs ISSUE-01).
// Uses only the repository interface, never Supabase directly.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok, created } = require('./http');
const { newId, now } = require('./store');
const { assertOwner } = require('./ownership');
const colour = require('../colour');

const FAMILIES = ['blue', 'green', 'purple', 'red', 'teal', 'plum', 'burgundy', 'black', 'gray', 'navy', 'orange', 'brown', 'pink', 'yellow', 'white', 'other'];
const ROLES = ['core', 'neutral', 'avoid'];

async function paletteWithChildren(db, palette) {
  const colours = (await db.list('paletteColours', palette.userId)).filter((item) => item.paletteId === palette.id);
  const avoidRules = (await db.list('avoidRules', palette.userId)).filter((item) => item.paletteId === palette.id);
  return { ...palette, colours, avoidRules };
}

async function deactivateOthers(db, userId, exceptId) {
  const palettes = await db.list('palettes', userId);
  for (const palette of palettes) {
    if (palette.id !== exceptId && palette.isActive) {
      await db.update('palettes', palette.id, { isActive: false, updatedAt: now() });
    }
  }
}

async function loadPalette(ctx) {
  const palette = await ctx.db.get('palettes', ctx.params.id);
  return assertOwner(palette, ctx.user.id);
}

function validatePaletteBody(body, partial) {
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['name', partial && body.name === undefined ? null : validate.checkRequiredString(body.name, 'name', 100)],
    ['sourceFileName', body.sourceFileName === undefined || body.sourceFileName === null ? null : validate.checkString(body.sourceFileName, 'sourceFileName', { maxLength: 200 })],
    ['isActive', validate.checkBoolean(body.isActive, 'isActive')],
  ]);
  if (details) throw errors.validationError(details);
}

async function createPalette(ctx) {
  validatePaletteBody(ctx.body, false);
  const body = ctx.body;
  const palette = {
    id: newId(),
    userId: ctx.user.id,
    name: body.name,
    sourceFileName: body.sourceFileName === undefined ? null : body.sourceFileName,
    uploadedAt: now(),
    isActive: body.isActive === true,
    version: 1,
    createdAt: now(),
    updatedAt: now(),
  };
  await ctx.db.insert('palettes', palette);
  if (palette.isActive) await deactivateOthers(ctx.db, ctx.user.id, palette.id);
  return created(await paletteWithChildren(ctx.db, palette));
}

async function listPalettes(ctx) {
  const pagination = validate.parsePagination(ctx.query);
  let palettes = await ctx.db.list('palettes', ctx.user.id);
  if (ctx.query.isActive !== undefined) {
    const parsed = validate.parseBooleanQuery(ctx.query.isActive);
    if (parsed === null) throw errors.validationError({ isActive: 'isActive must be true or false.' });
    palettes = palettes.filter((item) => item.isActive === parsed);
  }
  if (ctx.query.sort === 'name') palettes.sort((a, b) => a.name.localeCompare(b.name));
  else palettes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return ok(validate.paginate(palettes, pagination));
}

async function getPalette(ctx) {
  const palette = await loadPalette(ctx);
  return ok(await paletteWithChildren(ctx.db, palette));
}

async function updatePalette(ctx) {
  validatePaletteBody(ctx.body, true);
  const palette = await loadPalette(ctx);
  const patch = { updatedAt: now() };
  if (ctx.body.name !== undefined) patch.name = ctx.body.name;
  if (ctx.body.sourceFileName !== undefined) patch.sourceFileName = ctx.body.sourceFileName;
  if (ctx.body.isActive !== undefined) patch.isActive = ctx.body.isActive;
  const updated = await ctx.db.update('palettes', palette.id, patch);
  if (patch.isActive === true) await deactivateOthers(ctx.db, ctx.user.id, palette.id);
  return ok(await paletteWithChildren(ctx.db, updated));
}

async function deletePalette(ctx) {
  const palette = await loadPalette(ctx);
  const colours = await ctx.db.list('paletteColours', ctx.user.id);
  for (const item of colours.filter((entry) => entry.paletteId === palette.id)) {
    await ctx.db.delete('paletteColours', item.id);
  }
  const rules = await ctx.db.list('avoidRules', ctx.user.id);
  for (const item of rules.filter((entry) => entry.paletteId === palette.id)) {
    await ctx.db.delete('avoidRules', item.id);
  }
  await ctx.db.delete('palettes', palette.id);
  return ok({ deleted: true, id: palette.id });
}

async function activatePalette(ctx) {
  const palette = await loadPalette(ctx);
  const updated = await ctx.db.update('palettes', palette.id, { isActive: true, updatedAt: now() });
  await deactivateOthers(ctx.db, ctx.user.id, palette.id);
  return ok(await paletteWithChildren(ctx.db, updated));
}

async function createPaletteVersion(ctx) {
  const palette = await loadPalette(ctx);
  const body = ctx.body || {};
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['activate', validate.checkBoolean(body.activate, 'activate')],
    ['name', body.name === undefined ? null : validate.checkRequiredString(body.name, 'name', 100)],
  ]);
  if (details) throw errors.validationError(details);
  const copy = await paletteWithChildren(ctx.db, palette);
  const newPalette = {
    id: newId(),
    userId: ctx.user.id,
    name: body.name || copy.name,
    sourceFileName: copy.sourceFileName,
    uploadedAt: now(),
    isActive: body.activate === true,
    version: copy.version + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  await ctx.db.insert('palettes', newPalette);
  for (const item of copy.colours) {
    const { id, paletteId, createdAt, updatedAt, ...rest } = item;
    await ctx.db.insert('paletteColours', { ...rest, id: newId(), paletteId: newPalette.id, createdAt: now(), updatedAt: now() });
  }
  for (const item of copy.avoidRules) {
    const { id, paletteId, createdAt, updatedAt, ...rest } = item;
    await ctx.db.insert('avoidRules', { ...rest, id: newId(), paletteId: newPalette.id, createdAt: now(), updatedAt: now() });
  }
  if (newPalette.isActive) await deactivateOthers(ctx.db, ctx.user.id, newPalette.id);
  return created(await paletteWithChildren(ctx.db, newPalette));
}

function validateColourBody(body, partial) {
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['name', partial && body.name === undefined ? null : validate.checkRequiredString(body.name, 'name', 100)],
    ['hex', partial && body.hex === undefined ? null : validate.checkHex(body.hex, 'hex', { required: !partial })],
    ['labL', validate.checkNumber(body.labL, 'labL', {})],
    ['labA', validate.checkNumber(body.labA, 'labA', {})],
    ['labB', validate.checkNumber(body.labB, 'labB', {})],
    ['hue', validate.checkNumber(body.hue, 'hue', { min: 0, max: 360 })],
    ['saturation', validate.checkNumber(body.saturation, 'saturation', { min: 0, max: 100 })],
    ['lightness', validate.checkNumber(body.lightness, 'lightness', { min: 0, max: 100 })],
    ['family', partial && body.family === undefined ? null : validate.checkEnum(body.family, 'family', FAMILIES, { required: !partial })],
    ['role', partial && body.role === undefined ? null : validate.checkEnum(body.role, 'role', ROLES, { required: !partial })],
    ['sourcePage', body.sourcePage === undefined || body.sourcePage === null ? null : validate.checkInteger(body.sourcePage, 'sourcePage', { min: 1 })],
    ['isManual', validate.checkBoolean(body.isManual, 'isManual')],
  ]);
  if (details) throw errors.validationError(details);
}

function colourFromBody(body, paletteId) {
  const derived = colour.deriveFromHex(body.hex);
  return {
    id: newId(),
    paletteId,
    name: body.name,
    hex: body.hex,
    labL: body.labL === undefined ? derived.lab.l : body.labL,
    labA: body.labA === undefined ? derived.lab.a : body.labA,
    labB: body.labB === undefined ? derived.lab.b : body.labB,
    hue: body.hue === undefined ? derived.hsl.h : body.hue,
    saturation: body.saturation === undefined ? derived.hsl.s : body.saturation,
    lightness: body.lightness === undefined ? derived.hsl.l : body.lightness,
    family: body.family,
    role: body.role,
    sourcePage: body.sourcePage === undefined ? null : body.sourcePage,
    isManual: body.isManual === true,
    createdAt: now(),
    updatedAt: now(),
  };
}

async function loadPaletteForChild(ctx) {
  const palette = await ctx.db.get('palettes', ctx.params.paletteId);
  return assertOwner(palette, ctx.user.id);
}

async function createColour(ctx) {
  validateColourBody(ctx.body, false);
  const palette = await loadPaletteForChild(ctx);
  const record = colourFromBody(ctx.body, palette.id);
  await ctx.db.insert('paletteColours', record);
  return created(record);
}

async function listColours(ctx) {
  const palette = await loadPaletteForChild(ctx);
  const pagination = validate.parsePagination(ctx.query);
  let items = (await ctx.db.list('paletteColours', ctx.user.id)).filter((item) => item.paletteId === palette.id);
  if (ctx.query.role !== undefined) {
    if (!ROLES.includes(ctx.query.role)) throw errors.validationError({ role: 'role must be one of: core, neutral, avoid.' });
    items = items.filter((item) => item.role === ctx.query.role);
  }
  if (ctx.query.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
  else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return ok(validate.paginate(items, pagination));
}

async function loadColour(ctx) {
  const palette = await loadPaletteForChild(ctx);
  const record = await ctx.db.get('paletteColours', ctx.params.colourId);
  if (!record || record.paletteId !== palette.id) throw errors.notFound('Resource not found.');
  return assertOwner(record, ctx.user.id);
}

async function getColour(ctx) {
  return ok(await loadColour(ctx));
}

async function updateColour(ctx) {
  validateColourBody(ctx.body, true);
  const record = await loadColour(ctx);
  const patch = { updatedAt: now() };
  for (const field of ['name', 'hex', 'labL', 'labA', 'labB', 'hue', 'saturation', 'lightness', 'family', 'role', 'sourcePage', 'isManual']) {
    if (ctx.body[field] !== undefined) patch[field] = ctx.body[field];
  }
  if (ctx.body.hex !== undefined && (ctx.body.labL === undefined || ctx.body.labA === undefined || ctx.body.labB === undefined || ctx.body.hue === undefined || ctx.body.saturation === undefined || ctx.body.lightness === undefined)) {
    const derived = colour.deriveFromHex(ctx.body.hex);
    if (ctx.body.labL === undefined) patch.labL = derived.lab.l;
    if (ctx.body.labA === undefined) patch.labA = derived.lab.a;
    if (ctx.body.labB === undefined) patch.labB = derived.lab.b;
    if (ctx.body.hue === undefined) patch.hue = derived.hsl.h;
    if (ctx.body.saturation === undefined) patch.saturation = derived.hsl.s;
    if (ctx.body.lightness === undefined) patch.lightness = derived.hsl.l;
  }
  const updated = await ctx.db.update('paletteColours', record.id, patch);
  return ok(updated);
}

async function deleteColour(ctx) {
  const record = await loadColour(ctx);
  await ctx.db.delete('paletteColours', record.id);
  return ok({ deleted: true, id: record.id });
}

module.exports = {
  FAMILIES,
  ROLES,
  createPalette,
  listPalettes,
  getPalette,
  updatePalette,
  deletePalette,
  activatePalette,
  createPaletteVersion,
  paletteWithChildren,
  deactivateOthers,
  loadPalette,
  createColour,
  listColours,
  getColour,
  updateColour,
  deleteColour,
};
