// Avoid rule handlers (refs ISSUE-02).
// Avoid rules are hue, saturation, and lightness ranges, not single hexes,
// so a named rule like "warm oranges" works even without an exact hex
// (spec section 4.4). The rating engine matches colours against these ranges.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok, created } = require('./http');
const { newId, now } = require('./store');
const { assertOwner } = require('./ownership');

function validateRuleBody(body, partial) {
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['name', partial && body.name === undefined ? null : validate.checkRequiredString(body.name, 'name', 100)],
    ['hueMin', partial && body.hueMin === undefined ? null : validate.checkNumber(body.hueMin, 'hueMin', { required: !partial, min: 0, max: 360 })],
    ['hueMax', partial && body.hueMax === undefined ? null : validate.checkNumber(body.hueMax, 'hueMax', { required: !partial, min: 0, max: 360 })],
    ['saturationMin', partial && body.saturationMin === undefined ? null : validate.checkNumber(body.saturationMin, 'saturationMin', { required: !partial, min: 0, max: 100 })],
    ['saturationMax', partial && body.saturationMax === undefined ? null : validate.checkNumber(body.saturationMax, 'saturationMax', { required: !partial, min: 0, max: 100 })],
    ['lightnessMin', partial && body.lightnessMin === undefined ? null : validate.checkNumber(body.lightnessMin, 'lightnessMin', { required: !partial, min: 0, max: 100 })],
    ['lightnessMax', partial && body.lightnessMax === undefined ? null : validate.checkNumber(body.lightnessMax, 'lightnessMax', { required: !partial, min: 0, max: 100 })],
    ['description', body.description === undefined || body.description === null ? null : validate.checkString(body.description, 'description', { maxLength: 500 })],
  ]);
  if (details) throw errors.validationError(details);
  // Range pair checks need the merged values for PATCH, so callers check
  // pairs separately when they have the full record. For create, check here.
  if (!partial) {
    const pairDetails = {};
    validate.checkRangePair(body, 'hueMin', 'hueMax', pairDetails);
    validate.checkRangePair(body, 'saturationMin', 'saturationMax', pairDetails);
    validate.checkRangePair(body, 'lightnessMin', 'lightnessMax', pairDetails);
    if (Object.keys(pairDetails).length > 0) throw errors.validationError(pairDetails);
  }
}

async function loadPaletteForRule(ctx) {
  const palette = await ctx.db.get('palettes', ctx.params.paletteId);
  return assertOwner(palette, ctx.user.id);
}

async function createRule(ctx) {
  validateRuleBody(ctx.body, false);
  const palette = await loadPaletteForRule(ctx);
  const body = ctx.body;
  const record = {
    id: newId(),
    userId: ctx.user.id,
    paletteId: palette.id,
    name: body.name,
    hueMin: body.hueMin,
    hueMax: body.hueMax,
    saturationMin: body.saturationMin,
    saturationMax: body.saturationMax,
    lightnessMin: body.lightnessMin,
    lightnessMax: body.lightnessMax,
    description: body.description === undefined ? null : body.description,
    createdAt: now(),
    updatedAt: now(),
  };
  await ctx.db.insert('avoidRules', record);
  return created(record);
}

async function listRules(ctx) {
  const palette = await loadPaletteForRule(ctx);
  const pagination = validate.parsePagination(ctx.query);
  let items = (await ctx.db.list('avoidRules', ctx.user.id)).filter((item) => item.paletteId === palette.id);
  if (ctx.query.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
  else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return ok(validate.paginate(items, pagination));
}

async function loadRule(ctx) {
  const palette = await loadPaletteForRule(ctx);
  const record = await ctx.db.get('avoidRules', ctx.params.ruleId);
  if (!record || record.paletteId !== palette.id) throw errors.notFound('Resource not found.');
  return assertOwner(record, ctx.user.id);
}

async function getRule(ctx) {
  return ok(await loadRule(ctx));
}

async function updateRule(ctx) {
  validateRuleBody(ctx.body, true);
  const record = await loadRule(ctx);
  const merged = { ...record };
  for (const field of ['name', 'hueMin', 'hueMax', 'saturationMin', 'saturationMax', 'lightnessMin', 'lightnessMax', 'description']) {
    if (ctx.body[field] !== undefined) merged[field] = ctx.body[field];
  }
  const pairDetails = {};
  validate.checkRangePair(merged, 'hueMin', 'hueMax', pairDetails);
  validate.checkRangePair(merged, 'saturationMin', 'saturationMax', pairDetails);
  validate.checkRangePair(merged, 'lightnessMin', 'lightnessMax', pairDetails);
  if (Object.keys(pairDetails).length > 0) throw errors.validationError(pairDetails);
  merged.updatedAt = now();
  const updated = await ctx.db.update('avoidRules', record.id, merged);
  return ok(updated);
}

async function deleteRule(ctx) {
  const record = await loadRule(ctx);
  await ctx.db.delete('avoidRules', record.id);
  return ok({ deleted: true, id: record.id });
}

// Spec starting avoid rules (spec sections 4.4 and 15). Used as defaults by
// the rating engine when a palette has no avoid rules of its own, and as
// the reference values for the contract examples.
const DEFAULT_AVOID_RULES = [
  {
    name: 'warm oranges',
    hueMin: 20,
    hueMax: 50,
    saturationMin: 41,
    saturationMax: 100,
    lightnessMin: 30,
    lightnessMax: 70,
    description: 'Warm oranges, warm undertone, saturation above 40, lightness 30 to 70.',
  },
  {
    name: 'light pastels',
    hueMin: 0,
    hueMax: 360,
    saturationMin: 0,
    saturationMax: 44,
    lightnessMin: 76,
    lightnessMax: 100,
    description: 'Light pastels, lightness above 75, saturation below 45, any hue.',
  },
  {
    name: 'muted earthy hues',
    hueMin: 20,
    hueMax: 90,
    saturationMin: 10,
    saturationMax: 45,
    lightnessMin: 25,
    lightnessMax: 65,
    description: 'Muted earthy hues, including muted olive and camel, low saturation and warm.',
  },
];

function matchesAvoidRule(hsl, rule) {
  return (
    hsl.h >= rule.hueMin && hsl.h <= rule.hueMax &&
    hsl.s >= rule.saturationMin && hsl.s <= rule.saturationMax &&
    hsl.l >= rule.lightnessMin && hsl.l <= rule.lightnessMax
  );
}

module.exports = {
  createRule,
  listRules,
  getRule,
  updateRule,
  deleteRule,
  DEFAULT_AVOID_RULES,
  matchesAvoidRule,
};
