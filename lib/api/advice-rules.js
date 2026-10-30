// Advice rule API handlers (refs ISSUE-15).
// Rules are editable records. A disabled rule must never affect scoring;
// the browser rule engine reads only enabled rules. The seed endpoint
// creates the 10 spec section 6.5 starting rules, idempotently.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok, created } = require('./http');
const { newId, now } = require('./store');
const { assertOwner } = require('./ownership');
const { getStartingRules } = require('../advice-rules');
const { FAMILIES } = require('./palettes');

const ACTIONS = ['prefer', 'avoid', 'require'];

function validateRuleBody(body, partial) {
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['name', partial && body.name === undefined ? null : validate.checkRequiredString(body.name, 'name', 100)],
    ['conditionCategory', body.conditionCategory === undefined || body.conditionCategory === null ? null : validate.checkString(body.conditionCategory, 'conditionCategory', { maxLength: 200 })],
    ['conditionFitTag', body.conditionFitTag === undefined || body.conditionFitTag === null ? null : validate.checkString(body.conditionFitTag, 'conditionFitTag', { maxLength: 200 })],
    ['conditionColourFamily', body.conditionColourFamily === undefined || body.conditionColourFamily === null ? null : validate.checkEnum(body.conditionColourFamily, 'conditionColourFamily', FAMILIES, {})],
    ['action', partial && body.action === undefined ? null : validate.checkEnum(body.action, 'action', ACTIONS, { required: !partial })],
    ['weight', body.weight === undefined || body.weight === null ? null : validate.checkNumber(body.weight, 'weight', { min: 0, max: 100 })],
    ['reason', partial && body.reason === undefined ? null : validate.checkRequiredString(body.reason, 'reason', 500)],
    ['source', partial && body.source === undefined ? null : validate.checkRequiredString(body.source, 'source', 200)],
    ['sourceText', body.sourceText === undefined || body.sourceText === null ? null : validate.checkString(body.sourceText, 'sourceText', { maxLength: 5000 })],
    ['enabled', validate.checkBoolean(body.enabled, 'enabled')],
  ]);
  if (details) throw errors.validationError(details);
}

async function createRule(ctx) {
  validateRuleBody(ctx.body, false);
  const body = ctx.body;
  const record = {
    id: newId(),
    userId: ctx.user.id,
    name: body.name,
    conditionCategory: body.conditionCategory === undefined ? null : body.conditionCategory,
    conditionFitTag: body.conditionFitTag === undefined ? null : body.conditionFitTag,
    conditionColourFamily: body.conditionColourFamily === undefined ? null : body.conditionColourFamily,
    action: body.action,
    weight: body.weight === undefined || body.weight === null ? 50 : body.weight,
    reason: body.reason,
    source: body.source,
    sourceText: body.sourceText === undefined ? null : body.sourceText,
    enabled: body.enabled === undefined ? true : body.enabled,
    createdAt: now(),
    updatedAt: now(),
  };
  await ctx.db.insert('adviceRules', record);
  return created(record);
}

async function seedRules(ctx) {
  const existing = await ctx.db.list('adviceRules', ctx.user.id);
  if (existing.length > 0) {
    return ok({ seeded: false, data: existing });
  }
  const createdRules = [];
  for (const seed of getStartingRules()) {
    const record = {
      id: newId(),
      userId: ctx.user.id,
      name: seed.name,
      conditionCategory: seed.conditionCategory,
      conditionFitTag: seed.conditionFitTag,
      conditionColourFamily: null,
      action: seed.action,
      weight: seed.weight,
      reason: seed.reason,
      source: seed.source,
      sourceText: null,
      enabled: true,
      createdAt: now(),
      updatedAt: now(),
    };
    await ctx.db.insert('adviceRules', record);
    createdRules.push(record);
  }
  return { status: 201, body: { seeded: true, data: createdRules } };
}

async function listRules(ctx) {
  const pagination = validate.parsePagination(ctx.query);
  let rules = await ctx.db.list('adviceRules', ctx.user.id);
  if (ctx.query.enabled !== undefined) {
    const parsed = validate.parseBooleanQuery(ctx.query.enabled);
    if (parsed === null) throw errors.validationError({ enabled: 'enabled must be true or false.' });
    rules = rules.filter((item) => item.enabled === parsed);
  }
  if (ctx.query.sort === 'name') rules.sort((a, b) => a.name.localeCompare(b.name));
  else rules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return ok(validate.paginate(rules, pagination));
}

async function loadRule(ctx) {
  const record = await ctx.db.get('adviceRules', ctx.params.id);
  return assertOwner(record, ctx.user.id);
}

async function getRule(ctx) {
  return ok(await loadRule(ctx));
}

async function updateRule(ctx) {
  validateRuleBody(ctx.body, true);
  const record = await loadRule(ctx);
  const patch = { updatedAt: now() };
  for (const field of ['name', 'conditionCategory', 'conditionFitTag', 'conditionColourFamily', 'action', 'weight', 'reason', 'source', 'sourceText', 'enabled']) {
    if (ctx.body[field] !== undefined) patch[field] = ctx.body[field];
  }
  const updated = await ctx.db.update('adviceRules', record.id, patch);
  return ok(updated);
}

async function deleteRule(ctx) {
  const record = await loadRule(ctx);
  await ctx.db.delete('adviceRules', record.id);
  return ok({ deleted: true, id: record.id });
}

module.exports = { createRule, seedRules, listRules, getRule, updateRule, deleteRule };
