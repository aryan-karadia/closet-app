// Wear log handlers (refs ISSUE-14).
// Logging an outfit as worn increments wear count for every listed item
// and sets lastWornAt. Deleting a wear log decrements counts, floored at 0.
// Item snapshots are stored at log time, so later item deletion does not
// rewrite history (spec sections 6.7 and 7). No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok, created } = require('./http');
const { newId, now } = require('./store');
const { assertOwner } = require('./ownership');
const { OCCASIONS } = require('./outfits');

async function createWearLog(ctx) {
  const body = ctx.body || {};
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['outfitId', validate.checkRequiredString(body.outfitId, 'outfitId', 200)],
    ['occasion', body.occasion === undefined || body.occasion === null ? null : validate.checkEnum(body.occasion, 'occasion', OCCASIONS, {})],
    ['note', body.note === undefined || body.note === null ? null : validate.checkString(body.note, 'note', { maxLength: 500 })],
    ['wornAt', validate.checkDate(body.wornAt, 'wornAt')],
  ]);
  if (details) throw errors.validationError(details);
  if (!Array.isArray(body.itemIds) || body.itemIds.length === 0) {
    throw errors.validationError({ itemIds: 'itemIds must be a non empty array.' });
  }
  for (const itemId of body.itemIds) {
    if (typeof itemId !== 'string') throw errors.validationError({ itemIds: 'itemIds must be an array of strings.' });
  }
  const outfit = await ctx.db.get('outfits', body.outfitId);
  if (!outfit) throw errors.notFound('Resource not found.');
  assertOwner(outfit, ctx.user.id);
  const snapshots = [];
  for (const itemId of body.itemIds) {
    const item = await ctx.db.get('items', itemId);
    if (!item) throw errors.notFound('Resource not found.');
    if (item.userId !== ctx.user.id) throw errors.forbidden('This item belongs to another user.');
    snapshots.push({ itemId, itemName: item.name });
  }
  const wornAt = body.wornAt ? new Date(body.wornAt).toISOString() : now();
  const log = {
    id: newId(),
    userId: ctx.user.id,
    outfitId: body.outfitId,
    itemIds: body.itemIds,
    itemSnapshots: snapshots,
    wornAt,
    occasion: body.occasion === undefined ? null : body.occasion,
    note: body.note === undefined ? null : body.note,
    createdAt: now(),
    updatedAt: now(),
  };
  await ctx.db.insert('wearLogs', log);
  for (const itemId of body.itemIds) {
    const item = await ctx.db.get('items', itemId);
    if (item && !item.deletedAt) {
      await ctx.db.update('items', itemId, {
        wearCount: (item.wearCount || 0) + 1,
        lastWornAt: wornAt,
        updatedAt: now(),
      });
    }
  }
  return created(log);
}

async function listWearLogs(ctx) {
  const pagination = validate.parsePagination(ctx.query);
  let logs = await ctx.db.list('wearLogs', ctx.user.id);
  if (ctx.query.outfitId !== undefined) logs = logs.filter((item) => item.outfitId === ctx.query.outfitId);
  if (ctx.query.occasion !== undefined) {
    if (!OCCASIONS.includes(ctx.query.occasion)) throw errors.validationError({ occasion: 'occasion must be one of: daily, interview, formal, japan-travel, date-evening.' });
    logs = logs.filter((item) => item.occasion === ctx.query.occasion);
  }
  logs.sort((a, b) => new Date(b.wornAt) - new Date(a.wornAt));
  return ok(validate.paginate(logs, pagination));
}

async function loadWearLog(ctx) {
  const record = await ctx.db.get('wearLogs', ctx.params.id);
  return assertOwner(record, ctx.user.id);
}

async function getWearLog(ctx) {
  return ok(await loadWearLog(ctx));
}

async function deleteWearLog(ctx) {
  const log = await loadWearLog(ctx);
  await ctx.db.delete('wearLogs', log.id);
  for (const itemId of log.itemIds) {
    const item = await ctx.db.get('items', itemId);
    if (item) {
      await ctx.db.update('items', itemId, {
        wearCount: Math.max(0, (item.wearCount || 0) - 1),
        updatedAt: now(),
      });
    }
  }
  return ok({ deleted: true, id: log.id });
}

module.exports = { createWearLog, listWearLogs, getWearLog, deleteWearLog };
